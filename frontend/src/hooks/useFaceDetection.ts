/* eslint-disable @typescript-eslint/no-explicit-any */
const tracking = (window as any).tracking

const cache = new Map<string, { x: number; y: number }>()
const DEFAULT_POSITION = { x: 50, y: 30 }
const FACE_CATEGORIES = ['people']

export function useFaceDetection() {
  const shouldDetect = (category?: string): boolean => {
    return category ? FACE_CATEGORIES.includes(category) : false
  }

  const detectFace = (
    imgUrl: string,
    category?: string
  ): Promise<{ x: number; y: number }> => {
    if (!shouldDetect(category)) {
      return Promise.resolve(DEFAULT_POSITION)
    }

    if (imgUrl.includes('unsplash.com')) {
      return Promise.resolve(DEFAULT_POSITION)
    }

    if (cache.has(imgUrl)) {
      return Promise.resolve(cache.get(imgUrl)!)
    }

    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        try {
          const tracker = new tracking.ObjectTracker(['face'])

          tracker.on('track', (e: { data: Array<{ x: number; y: number; width: number; height: number }> }) => {
            const face = e.data[0]
            if (face) {
              const x = ((face.x + face.width / 2) / img.width) * 100
              const y = ((face.y + face.height / 2) / img.height) * 100
              cache.set(imgUrl, { x, y })
              resolve({ x, y })
            } else {
              resolve(DEFAULT_POSITION)
            }
          })

          tracking.track(img, tracker)
        } catch {
          resolve(DEFAULT_POSITION)
        }
      }

      img.onerror = () => resolve(DEFAULT_POSITION)
      img.src = imgUrl
    })
  }

  return { shouldDetect, detectFace }
}
