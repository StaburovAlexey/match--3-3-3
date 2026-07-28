import * as THREE from 'three'
import type { TransformCrack } from './ElementMaterialConfig.ts'

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
  uCrackTime: THREE.IUniform<number>
  uCrackHighlightSpeed: THREE.IUniform<number>
  uCrackHighlightGlow: THREE.IUniform<number>
  uCrackDeformStrength: THREE.IUniform<number>
  uCrackDeformSpeed: THREE.IUniform<number>
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
    uCrackTime: { value: 0 },
    uCrackHighlightSpeed: { value: settings.highlightSpeed },
    uCrackHighlightGlow: { value: settings.highlightGlow },
    uCrackDeformStrength: { value: settings.deformStrength },
    uCrackDeformSpeed: { value: settings.deformSpeed },
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
      uniform float uCrackTime;
      uniform float uCrackHighlightSpeed;
      uniform float uCrackHighlightGlow;
      uniform float uCrackDeformStrength;
      uniform float uCrackDeformSpeed;
      uniform vec3 uCrackColor;
      uniform vec3 uCrackFillColor;
      uniform vec3 uCrackHighlightColor;

      varying vec3 vCrackWorldPosition;
      varying vec3 vCrackWorldNormal;

      vec2 crackHash(vec2 p) {
        p = vec2(
          dot(p, vec2(127.1, 311.7)),
          dot(p, vec2(269.5, 183.3))
        );
        return fract(sin(p) * 43758.5453);
      }

      vec2 animatedCrackPoint(vec2 cell) {
        vec2 point = crackHash(cell);
        vec2 direction = crackHash(cell + vec2(17.3, 41.7)) * 2.0 - 1.0;
        float phase = crackHash(cell + vec2(91.2, 13.8)).x * 6.2831853;
        float movement = sin(uCrackTime * uCrackDeformSpeed + phase);

        point += direction * movement * uCrackDeformStrength;
        return clamp(point, vec2(0.06), vec2(0.94));
      }

      float crackVoronoi(vec2 uv, float width) {
        vec2 cell = floor(uv);
        vec2 local = fract(uv);
        float nearest = 10.0;
        float secondNearest = 10.0;

        for (int y = -1; y <= 1; y++) {
          for (int x = -1; x <= 1; x++) {
            vec2 offset = vec2(float(x), float(y));
              vec2 point = animatedCrackPoint(cell + offset);
            float distanceToPoint = length(offset + point - local);

            if (distanceToPoint < nearest) {
              secondNearest = nearest;
              nearest = distanceToPoint;
            } else if (distanceToPoint < secondNearest) {
              secondNearest = distanceToPoint;
            }
          }
        }

        float edgeDistance = secondNearest - nearest;
        return 1.0 - smoothstep(0.0, width, edgeDistance);
      }

      float proceduralCracks(float width) {
        vec3 position = vCrackWorldPosition * uCrackScale;
        vec3 normal = abs(normalize(vCrackWorldNormal));
        normal = pow(normal, vec3(4.0));
        normal /= max(normal.x + normal.y + normal.z, 0.0001);

        float crackXY = crackVoronoi(position.xy, width);
        float crackXZ = crackVoronoi(position.xz, width);
        float crackYZ = crackVoronoi(position.yz, width);

        return (
          crackXY * normal.z +
          crackXZ * normal.y +
          crackYZ * normal.x
        );
      }
    `

    shader.vertexShader = `
      varying vec3 vCrackWorldPosition;
      varying vec3 vCrackWorldNormal;
    `
      .concat(shader.vertexShader)
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
          vCrackWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
          vCrackWorldNormal = normalize(mat3(modelMatrix) * normal);`,
      )

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `${crackFunctions}\n#include <common>`)
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
          float crack = proceduralCracks(uCrackWidth);
          float crackFill = proceduralCracks(uCrackWidth * 4.0);
          float crackHighlight = proceduralCracks(uCrackWidth * 0.3);
          float highlightPulse = 0.35 + 0.65 * (
            0.5 + 0.5 * sin(uCrackTime * uCrackHighlightSpeed)
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
            crackHighlight * uCrackHighlightStrength * highlightPulse
          );
          diffuseColor.rgb += uCrackHighlightColor * crackHighlight * uCrackHighlightGlow * highlightPulse;`,
      )
  }

  material.customProgramCacheKey = () => 'procedural-cracks-v1'
  material.userData.crackUniforms = uniforms

  return uniforms
}
