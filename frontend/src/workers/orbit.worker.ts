import * as satellite from "satellite.js";

export type SatelliteStatus = 'ok' | 'error';

export interface TLEData {
  noradId: string;
  name: string;
  line1: string;
  line2: string;
  countryCode?: string;
  mission?: string;
  operator?: string;
}

export interface SatelliteMetadata {
  name: string;
  countryCode?: string;
  mission?: string;
  operator?: string;
}

export interface PositionData {
  noradId: string;
  lat: number | null;
  lng: number | null;
  alt: number | null;
  status: SatelliteStatus;
}

export interface FailedSatellite {
  noradId: string;
  name: string;
  reason: string;
  countryCode?: string;
  mission?: string;
  operator?: string;
}

interface SatelliteCache {
  noradId: string;
  name: string;
  satrec: satellite.SatRec;
  countryCode?: string;
  mission?: string;
  operator?: string;
}

const satellites: Map<string, SatelliteCache> = new Map();
const failedSatCache: Map<string, FailedSatellite> = new Map();
const allNoradIds: string[] = [];
let isInitialized = false;

self.onmessage = (e: MessageEvent) => {
  const { type, data } = e.data;

  if (type === "init") {
    initSatellites(data.tles);
  } else if (type === "compute") {
    computePositions(data.timestamp);
  }
};

function initSatellites(tles: TLEData[]) {
  satellites.clear();
  failedSatCache.clear();
  allNoradIds.length = 0;

  const metadata: Record<string, SatelliteMetadata | null> = {};
  let successCount = 0;

  tles.forEach((tle) => {
    allNoradIds.push(tle.noradId);

    try {
      const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
      satellites.set(tle.noradId, {
        noradId: tle.noradId,
        name: tle.name,
        satrec,
        countryCode: tle.countryCode,
        mission: tle.mission,
        operator: tle.operator,
      });

      metadata[tle.noradId] = {
        name: tle.name,
        countryCode: tle.countryCode,
        mission: tle.mission,
        operator: tle.operator,
      };

      successCount++;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      failedSatCache.set(tle.noradId, {
        noradId: tle.noradId,
        name: tle.name,
        reason,
        countryCode: tle.countryCode,
        mission: tle.mission,
        operator: tle.operator,
      });
      metadata[tle.noradId] = null;
      console.warn(`[OrbitWorker] TLE解析失败 - noradId: ${tle.noradId}, name: ${tle.name}, error:`, reason);
    }
  });

  isInitialized = true;

  self.postMessage({
    type: "ready",
    data: {
      total: tles.length,
      successCount,
      errorCount: failedSatCache.size,
      failedSatellites: Array.from(failedSatCache.values()),
    },
  });

  self.postMessage({
    type: "metadata",
    data: metadata,
  });
}

function computePositions(timestamp: number) {
  if (!isInitialized) {
    self.postMessage({ type: "positions", data: [], timestamp: new Date().toISOString() });
    return;
  }

  const now = new Date(timestamp);
  const positions: PositionData[] = [];
  let computeErrorCount = 0;

  allNoradIds.forEach((noradId) => {
    const sat = satellites.get(noradId);

    if (sat) {
      try {
        const gmst = satellite.gstime(now);
        const positionAndVelocity = satellite.propagate(sat.satrec, now);

        if (positionAndVelocity.position) {
          const positionEci = positionAndVelocity.position;
          const positionGd = satellite.eciToGeodetic(positionEci, gmst);

          const latitude = satellite.radiansToDegrees(positionGd.latitude);
          const longitude = satellite.radiansToDegrees(positionGd.longitude);
          const altitude = positionGd.height * 1000;

          if (Number.isFinite(latitude) && Number.isFinite(longitude) && Number.isFinite(altitude)) {
            positions.push({
              noradId,
              lat: latitude,
              lng: longitude,
              alt: altitude,
              status: 'ok',
            });
          } else {
            positions.push({
              noradId,
              lat: null,
              lng: null,
              alt: null,
              status: 'error',
            });
            computeErrorCount++;
          }
        } else {
          positions.push({
            noradId,
            lat: null,
            lng: null,
            alt: null,
            status: 'error',
          });
          computeErrorCount++;
        }
      } catch {
        positions.push({
          noradId,
          lat: null,
          lng: null,
          alt: null,
          status: 'error',
        });
        computeErrorCount++;
      }
    } else {
      positions.push({
        noradId,
        lat: null,
        lng: null,
        alt: null,
        status: 'error',
      });
    }
  });

  if (computeErrorCount > 0) {
    console.warn(`[OrbitWorker] 本轮轨道计算失败 ${computeErrorCount}/${allNoradIds.length} 颗卫星`);
  }

  self.postMessage({
    type: "positions",
    data: positions,
    timestamp: now.toISOString(),
    computeErrorCount,
  });
}
