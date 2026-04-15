export interface TLEData {
  name: string;
  noradId: string;
  line1: string;
  line2: string;
  epoch?: string | null;
  eccentricity?: number | null;
  raan?: number | null;
  argOfPerigee?: number | null;
  inclination?: number | null;
  meanMotion?: number | null;
}

export interface SatelliteMetadata {
  noradId: string;
  name?: string | null;
  objectId?: string | null;
  altNames?: string[] | null;
  objectType?: string | null;
  status?: string | null;
  countryCode?: string | null;
  launchDate?: string | null;
  launchSite?: string | null;
  launchVehicle?: string | null;
  decayDate?: string | null;
  period?: number | null;
  inclination?: number | null;
  apogee?: number | null;
  perigee?: number | null;
  eccentricity?: number | null;
  raan?: number | null;
  argOfPerigee?: number | null;
  rcs?: string | null;
  stdMag?: number | null;
  tleEpoch?: string | null;
  tleAge?: number | null;
  mission?: string | null;
  operator?: string | null;
  contractor?: string | null;
  launchMass?: number | null;
  lifetime?: string | null;
  platform?: string | null;
  cosparId?: string | null;
  objectClass?: string | null;
  shape?: string | null;
  dimensions?: string | null;
  span?: number | null;
  firstEpoch?: string | null;
  predDecayDate?: string | null;
  flightNo?: string | null;
  cosparLaunchNo?: string | null;
  launchFailure?: boolean | null;
  launchSiteName?: string | null;
  purpose?: string | null;
  bus?: string | null;
  length?: number | null;
  diameter?: number | null;
  dryMass?: number | null;
  constellationName?: string | null;
  equipment?: string | null;
  adcs?: string | null;
  payload?: string | null;
  manufacturer?: string | null;
  configuration?: string | null;
  power?: string | null;
  motor?: string | null;
  summary?: string | null;
  stable_date?: string | null;
  launch_pad?: string | null;
  material_composition?: string | null;
  major_events?: string | null;
  related_satellites?: string | null;
  transmitter_frequencies?: string | null;
}

export interface SatellitePosition {
  noradId: string;
  name: string;
  position: { lat: number; lng: number; alt: number };
  timestamp?: string;
  countryCode?: string;
  mission?: string;
  operator?: string;
}

export interface OrbitPoint {
  lat: number;
  lng: number;
  alt: number;
  timestamp?: string;
  velocity?: { x: number; y: number; z: number };
}

export interface OrbitPrediction {
  noradId: string;
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  steps: number;
  orbit: OrbitPoint[];
  orbitalPeriod?: number;
}

export interface PositionPrediction {
  noradId: string;
  name: string;
  timestamp: string;
  position: { lat: number; lng: number; alt: number };
  velocity: { x: number; y: number; z: number; total: number };
  orbitalInfo?: { period: number; inclination: number; eccentricity: number };
}

export interface SatelliteData {
  name: string;
  noradId: string;
  satrec: any;
}

export interface ObserverPosition {
  lat: number;
  lng: number;
  alt: number;
}

export interface PassEvent {
  startTime: string;
  endTime: string;
  maxElevationTime: string;
  maxElevation: number;
  startAzimuth: number;
  endAzimuth: number;
  maxAzimuth: number;
  duration: number;
  visible: boolean;
}

export interface PassPrediction {
  noradId: string;
  name: string;
  observer: ObserverPosition;
  passes: PassEvent[];
  startDate: string;
  endDate: string;
  totalPasses: number;
}

export interface OrbitSegment {
  startTime: string;
  endTime: string;
  status: 'sunlight' | 'eclipse';
  points: OrbitPoint[];
}

export interface SunlightAnalysis {
  noradId: string;
  name: string;
  analysisStartTime: string;
  analysisEndTime: string;
  orbitalPeriod: number;
  sunlightRatio: number;
  sunlightDuration: number;
  eclipseDuration: number;
  currentStatus: 'sunlight' | 'eclipse';
  nextEclipseEntry?: string;
  nextEclipseExit?: string;
  timeToNextEvent?: number;
  orbitSegments: OrbitSegment[];
}

export interface SunlightStatus {
  noradId: string;
  name: string;
  timestamp: string;
  status: 'sunlight' | 'eclipse';
  sunDirection?: { x: number; y: number; z: number };
  nextEvent?: { type: 'entry' | 'exit'; time: string; minutesUntil: number };
}
