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
