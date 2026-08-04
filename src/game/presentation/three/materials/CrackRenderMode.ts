export type CrackRenderMode = 'static' | 'off'

export function resolveCrackRenderMode(search: string): CrackRenderMode {
  return new URLSearchParams(search).get('cracks') === 'off' ? 'off' : 'static'
}
