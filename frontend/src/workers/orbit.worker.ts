import * as satellite from 'satellite.js'

export interface TLEData {
  noradId: string
  name: string
  line1: string
  line2: string
  countryCode?: string
  mission?: string
  operator?: string
}

export interface SatellitePosition {
  noradId: string
  name: string
  position: {
    lat: number
    lng: number
    alt: number
  }
  timestamp: string
  countryCode?: string
  mission?: string
  operator?: string
}

interface SatelliteCache {
  noradId: string
  name: string
  satrec: satellite.SatRec
  countryCode?: string
  mission?: string
  operator?: string
}

let satellites: Map<string, SatelliteCache> = new Map()
let isInitialized = false

self.onmessage = (e: MessageEvent) => {
  const { type, data } = e.data

  if (type === 'init') {
    initSatellites(data.tles)
  } else if (type === 'compute') {
    computePositions(data.timestamp)
  }
}

function initSatellites(tles: TLEData[]) {
  satellites.clear()
  let successCount = 0
  let errorCount = 0

  tles.forEach((tle) => {
    try {
      const satrec = satellite.twoline2satrec(tle.line1, tle.line2)
      satellites.set(tle.noradId, {
        noradId: tle.noradId,
        name: tle.name,
        satrec,
        countryCode: tle.countryCode,
        mission: tle.mission,
        operator: tle.operator,
      })
      successCount++
    } catch {
      errorCount++
    }
  })

  isInitialized = true
  self.postMessage({
    type: 'ready',
    data: {
      total: satellites.size,
      successCount,
      errorCount,
    },
  })
}

function computePositions(timestamp: number) {
  if (!isInitialized || satellites.size === 0) {
    self.postMessage({ type: 'positions', data: [] })
    return
  }

  const now = new Date(timestamp)
  const positions: SatellitePosition[] = []

  satellites.forEach((sat) => {
    try {
      const gmst = satellite.gstime(now)
      const positionAndVelocity = satellite.propagate(sat.satrec, now)

      if (positionAndVelocity.position) {
        const positionEci = positionAndVelocity.position
        const positionGd = satellite.eciToGeodetic(positionEci, gmst)

        const latitude = satellite.radiansToDegrees(positionGd.latitude)
        const longitude = satellite.radiansToDegrees(positionGd.longitude)
        const altitude = positionGd.height * 1000

        if (
          Number.isFinite(latitude) &&
          Number.isFinite(longitude) &&
          Number.isFinite(altitude)
        ) {
          positions.push({
            noradId: sat.noradId,
            name: sat.name,
            position: {
              lat: latitude,
              lng: longitude,
              alt: altitude,
            },
            timestamp: now.toISOString(),
            countryCode: sat.countryCode,
            mission: sat.mission,
            operator: sat.operator,
          })
        }
      }
    } catch {
      // Skip satellites with calculation errors
    }
  })

  self.postMessage({
    type: 'positions',
    data: positions,
    timestamp: now.toISOString(),
  })
}

export {}