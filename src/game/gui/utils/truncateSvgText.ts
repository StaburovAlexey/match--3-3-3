export interface SvgTextTruncationOptions {
  readonly maxWidth: number
  readonly fontSize: number
  readonly fontWeight?: number | string
  readonly fontFamily?: string
  readonly letterSpacing?: number
}

const DEFAULT_FONT_FAMILY = "'Goldman Sans', sans-serif"
const FALLBACK_GLYPH_WIDTH_RATIO = 0.62

let canvasContext: CanvasRenderingContext2D | null | undefined

function getCanvasContext(): CanvasRenderingContext2D | null {
  if (canvasContext !== undefined) return canvasContext
  if (typeof document === 'undefined') {
    canvasContext = null
    return canvasContext
  }

  const canvas = document.createElement('canvas')
  canvasContext = canvas.getContext('2d')
  return canvasContext
}

function fallbackWidth(text: string, options: SvgTextTruncationOptions): number {
  const letterSpacing = options.letterSpacing ?? 0
  return (
    text.length * options.fontSize * FALLBACK_GLYPH_WIDTH_RATIO +
    Math.max(text.length - 1, 0) * letterSpacing
  )
}

function textWidth(text: string, options: SvgTextTruncationOptions): number {
  const context = getCanvasContext()
  if (!context) return fallbackWidth(text, options)

  context.font = `${options.fontWeight ?? 400} ${options.fontSize}px ${options.fontFamily ?? DEFAULT_FONT_FAMILY}`
  const width = context.measureText(text).width
  const letterSpacing = options.letterSpacing ?? 0
  return width + Math.max(text.length - 1, 0) * letterSpacing
}

/**
 * SVG has no reliable CSS text-overflow/ellipsis behavior for <text> nodes.
 * Measure the string in the same font as the SVG and shorten it to the
 * available viewBox width when necessary.
 */
export function truncateSvgText(value: string, options: SvgTextTruncationOptions): string {
  const text = value.trim()
  if (!text || options.maxWidth <= 0) return ''
  if (textWidth(text, options) <= options.maxWidth) return text

  const suffix = '…'
  if (textWidth(suffix, options) > options.maxWidth) return ''

  const characters = Array.from(text)
  let lower = 0
  let upper = characters.length
  let result = suffix

  while (lower <= upper) {
    const middle = Math.floor((lower + upper) / 2)
    const candidate = `${characters.slice(0, middle).join('')}${suffix}`

    if (textWidth(candidate, options) <= options.maxWidth) {
      result = candidate
      lower = middle + 1
    } else {
      upper = middle - 1
    }
  }

  return result
}
