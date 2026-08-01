import * as THREE from 'three'

export interface TextureDefinition {
  url: string
  colorSpace?: THREE.ColorSpace
}

export type TextureCatalog = Record<string, string | TextureDefinition>

export default class TextureLoader {
  private readonly loader = new THREE.TextureLoader()
  private readonly textures = new Map<string, THREE.Texture>()

  async loadAll(catalog: TextureCatalog): Promise<void> {
    await Promise.all(
      Object.entries(catalog).map(async ([key, definition]) => {
        const { url, colorSpace = THREE.SRGBColorSpace } =
          typeof definition === 'string' ? { url: definition } : definition
        const texture = await this.loader.loadAsync(url)
        texture.colorSpace = colorSpace
        this.textures.set(key, texture)
      }),
    )
  }

  get(key: string): THREE.Texture {
    const texture = this.textures.get(key)
    if (!texture) throw new Error(`Текстура с ключом "${key}" не загружена`)
    return texture
  }

  has(key: string): boolean {
    return this.textures.has(key)
  }

  dispose(): void {
    this.textures.forEach((texture) => texture.dispose())
    this.textures.clear()
  }
}

export const textureLoader = new TextureLoader()
