import { shallowRef } from 'vue'

const fontRevision = shallowRef(0)
let fontReadyPromise: Promise<void> | undefined

function trackFontLoading(): void {
  if (fontReadyPromise || typeof document === 'undefined' || !document.fonts) return

  fontReadyPromise = Promise.all([
    document.fonts.load('700 12px "Goldman Sans"'),
    document.fonts.load('800 12px "Goldman Sans"'),
    document.fonts.load('900 12px "Goldman Sans"'),
  ])
    .catch(() => [])
    .then(() => {
      fontRevision.value += 1
    })
}

export function useGoldmanSansReady() {
  trackFontLoading()
  return fontRevision
}
