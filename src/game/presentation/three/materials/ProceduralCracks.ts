import * as THREE from 'three'
import type { TransformCrack } from './CrackMaterialConfig.ts'

export interface CrackSettings extends TransformCrack {
  color: THREE.Color
  fillColor: THREE.Color
  highlightColor: THREE.Color
}

export interface CrackUniforms {
  uCrackScale: THREE.IUniform<number>
  uCrackWidth: THREE.IUniform<number>
  uCrackStrength: THREE.IUniform<number>
  uCrackFillStrength: THREE.IUniform<number>
  uCrackHighlightStrength: THREE.IUniform<number>
  uCrackPulse: THREE.IUniform<number>
  uCrackHighlightGlow: THREE.IUniform<number>
  uCrackColor: THREE.IUniform<THREE.Color>
  uCrackFillColor: THREE.IUniform<THREE.Color>
  uCrackHighlightColor: THREE.IUniform<THREE.Color>
}

export function applyProceduralCracks(
  material: THREE.Material,
  settings: CrackSettings,
): CrackUniforms {
  const uniforms: CrackUniforms = {
    uCrackScale: { value: settings.scale },
    uCrackWidth: { value: settings.width },
    uCrackStrength: { value: settings.strength },
    uCrackFillStrength: { value: settings.fillStrength },
    uCrackHighlightStrength: { value: settings.highlightStrength },
    uCrackPulse: { value: 0.675 },
    uCrackHighlightGlow: { value: settings.highlightGlow },
    uCrackColor: { value: settings.color.clone() },
    uCrackFillColor: { value: settings.fillColor.clone() },
    uCrackHighlightColor: { value: settings.highlightColor.clone() },
  }

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)

    const crackFunctions = /* glsl */ `
      uniform float uCrackScale;
      uniform float uCrackWidth;
      uniform float uCrackStrength;
      uniform float uCrackFillStrength;
      uniform float uCrackHighlightStrength;
      uniform float uCrackPulse;
      uniform float uCrackHighlightGlow;
      uniform vec3 uCrackColor;
      uniform vec3 uCrackFillColor;
      uniform vec3 uCrackHighlightColor;

      varying vec3 vCrackLocalPosition;
      varying vec3 vCrackLocalNormal;

      vec2 crackHash(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.xx + p3.yz) * p3.zy);
      }

      vec2 crackProjection(vec3 position, vec3 normal) {
        vec3 axis = abs(normalize(normal));

        if (axis.x >= axis.y && axis.x >= axis.z) {
          return position.yz;
        }
        if (axis.y >= axis.z) {
          return position.xz;
        }
        return position.xy;
      }

      float crackVoronoiEdge(vec2 uv) {
        vec2 cell = floor(uv);
        vec2 local = fract(uv);
        float nearest = 10.0;
        float secondNearest = 10.0;

        for (int y = -1; y <= 1; y++) {
          for (int x = -1; x <= 1; x++) {
            vec2 offset = vec2(float(x), float(y));
            vec2 point = crackHash(cell + offset);
            vec2 delta = offset + point - local;
            float distanceToPoint = dot(delta, delta);

            if (distanceToPoint < nearest) {
              secondNearest = nearest;
              nearest = distanceToPoint;
            } else if (distanceToPoint < secondNearest) {
              secondNearest = distanceToPoint;
            }
          }
        }

        return max(secondNearest - nearest, 0.0);
      }
    `

    shader.vertexShader = `
      varying vec3 vCrackLocalPosition;
      varying vec3 vCrackLocalNormal;
    `
      .concat(shader.vertexShader)
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
          vCrackLocalPosition = transformed;
          vCrackLocalNormal = normalize(objectNormal);`,
      )

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `${crackFunctions}\n#include <common>`)
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
          vec3 crackPosition = vCrackLocalPosition * uCrackScale;
          vec2 crackUv = crackProjection(crackPosition, vCrackLocalNormal);
          float crackEdge = crackVoronoiEdge(crackUv);
          float crack = 1.0 - smoothstep(0.0, uCrackWidth, crackEdge);
          float crackFill = 1.0 - smoothstep(
            0.0,
            uCrackWidth * 4.0,
            crackEdge
          );
          float crackHighlight = 1.0 - smoothstep(
            0.0,
            uCrackWidth * 0.3,
            crackEdge
          );
          diffuseColor.rgb = mix(
            diffuseColor.rgb,
            uCrackFillColor,
            crackFill * uCrackFillStrength
          );
          diffuseColor.rgb = mix(diffuseColor.rgb, uCrackColor, crack * uCrackStrength);
          diffuseColor.rgb = mix(
            diffuseColor.rgb,
            uCrackHighlightColor,
            crackHighlight * uCrackHighlightStrength * uCrackPulse
          );
          diffuseColor.rgb += uCrackHighlightColor * crackHighlight * uCrackHighlightGlow * uCrackPulse;`,
      )
  }

  material.customProgramCacheKey = () => 'procedural-cracks-static-dominant-v2'
  material.userData.crackUniforms = uniforms

  return uniforms
}
