/// <reference types="vite/client" />

declare module '*.glb' {
  const src: string
  export default src
}

// Vite 环境变量类型声明
interface ImportMetaEnv {
  readonly VITE_MINIO_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// tracking.js 挂载在 window.tracking 上
interface Window {
  tracking?: {
    ObjectTracker: new (types: string[]) => ObjectTrackerInstance
    track: (img: HTMLImageElement, tracker: ObjectTrackerInstance) => void
  }
}

interface ObjectTrackerInstance {
  on(event: 'track', handler: (e: { data: FaceData[] }) => void): void
}

interface FaceData {
  x: number
  y: number
  width: number
  height: number
}
