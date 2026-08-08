import { describe, expect, it } from 'vitest'
import { truncateSvgText } from './truncateSvgText.ts'

const options = {
  maxWidth: 36,
  fontSize: 12,
  fontWeight: 900,
}

describe('truncateSvgText', () => {
  it('keeps a value that fits the SVG text area', () => {
    expect(truncateSvgText('1 416', { ...options, maxWidth: 40 })).toBe('1 416')
  })

  it('adds an ellipsis when a value exceeds the SVG text area', () => {
    expect(truncateSvgText('999 999 999', options)).toBe('999…')
  })

  it('does not split a unicode surrogate pair while truncating', () => {
    const result = truncateSvgText('Игрок😀соченьдлиннымименем', {
      maxWidth: 40,
      fontSize: 8,
      fontWeight: 900,
    })

    expect(result.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')).not.toMatch(/[\uD800-\uDFFF]/)
  })
})
