import type { ElementType } from '../../core/model/Element.ts'
import type { CombatantDefinition } from '../core/PvPBattleTypes.ts'

const baseUrl = import.meta.env.BASE_URL

const portraits: Record<ElementType, string> = {
  dark: new URL('../../../assets/hero/ChatGPT Image 4 авг. 2026 г., 13_52_13.png', import.meta.url)
    .href,
  ice: new URL('../../../assets/hero/ChatGPT Image 4 авг. 2026 г., 13_52_22.png', import.meta.url)
    .href,
  light: new URL('../../../assets/hero/ChatGPT Image 4 авг. 2026 г., 13_52_35.png', import.meta.url)
    .href,
  fire: new URL('../../../assets/hero/ChatGPT Image 4 авг. 2026 г., 13_52_42.png', import.meta.url)
    .href,
  earth: new URL('../../../assets/hero/ChatGPT Image 4 авг. 2026 г., 13_52_50.png', import.meta.url)
    .href,
}

function elementIcon(elementType: ElementType): string {
  return `${baseUrl}texture/${elementType}128px.png`
}

function textureIcon(name: 'bomb' | 'lightning'): string {
  return `${baseUrl}texture/${name}.png`
}

export const heroCatalog = [
  {
    id: 'shadow-rift',
    name: 'ShadowRift',
    portraitUrl: portraits.dark,
    elementType: 'dark',
    maxHp: 3200,
    abilities: [
      {
        id: 'void-pull',
        version: 1,
        kind: 'active',
        name: 'Shift',
        description:
          'Меняет местами два выбранных куба и наносит дополнительный истинный урон в конце раунда.',
        iconUrl: textureIcon('lightning'),
        unlockLevel: 1,
        activation: { type: 'manual', energyCost: 40, usageLimit: { perRound: 1 } },
        fieldEffect: { type: 'swap' },
        effects: [
          {
            type: 'deal-damage',
            target: 'enemy',
            channel: 'true',
            value: { type: 'constant', value: 35 },
            timing: 'round-resolution',
          },
        ],
      },
      {
        id: 'shadow-shift',
        version: 1,
        kind: 'passive',
        name: 'Void',
        description: 'Пассивная связь с Тьмой. Автоматический эффект будет добавлен позднее.',
        iconUrl: elementIcon('dark'),
        unlockLevel: 1,
        activation: { type: 'automatic' },
        effects: [],
      },
      {
        id: 'night-bolt',
        version: 1,
        kind: 'ultimate',
        name: 'Bolt',
        description: 'Поворачивает соседние сегменты и наносит 120 истинного урона.',
        iconUrl: textureIcon('bomb'),
        unlockLevel: 1,
        activation: { type: 'manual', energyCost: 100, usageLimit: { perBattle: 1 } },
        fieldEffect: {
          type: 'rotateSegment',
          orientation: 'horizontal',
          pattern: 'adjacent',
          oppositeRotation: false,
        },
        effects: [
          {
            type: 'deal-damage',
            target: 'enemy',
            channel: 'true',
            value: { type: 'constant', value: 120 },
            timing: 'round-resolution',
          },
        ],
      },
    ],
  },
  {
    id: 'valexey',
    name: 'Valexey',
    portraitUrl: portraits.ice,
    elementType: 'ice',
    maxHp: 3200,
    abilities: [
      {
        id: 'frostweave',
        version: 1,
        kind: 'active',
        name: 'Frostweave',
        description: 'Превращает два выбранных куба в Лёд и добавляет 35 ледяного урона.',
        iconUrl: elementIcon('ice'),
        unlockLevel: 1,
        activation: { type: 'manual', energyCost: 40, usageLimit: { perRound: 1 } },
        fieldEffect: { type: 'convert', elementType: 'ice', targetCount: 2 },
        effects: [
          {
            type: 'deal-damage',
            target: 'enemy',
            channel: 'ice',
            value: { type: 'constant', value: 35 },
            timing: 'round-resolution',
          },
        ],
      },
      {
        id: 'cold-discipline',
        version: 1,
        kind: 'passive',
        name: 'Cold Discipline',
        description: 'Пассивное владение Льдом. Автоматический эффект будет добавлен позднее.',
        iconUrl: elementIcon('ice'),
        unlockLevel: 1,
        activation: { type: 'automatic' },
        effects: [],
      },
      {
        id: 'absolute-zero',
        version: 1,
        kind: 'ultimate',
        name: 'Absolute Zero',
        description: 'Поворачивает вертикальные соседние сегменты и наносит 120 ледяного урона.',
        iconUrl: textureIcon('lightning'),
        unlockLevel: 1,
        activation: { type: 'manual', energyCost: 100, usageLimit: { perBattle: 1 } },
        fieldEffect: {
          type: 'rotateSegment',
          orientation: 'vertical',
          pattern: 'adjacent',
          oppositeRotation: false,
        },
        effects: [
          {
            type: 'deal-damage',
            target: 'enemy',
            channel: 'ice',
            value: { type: 'constant', value: 120 },
            timing: 'round-resolution',
          },
        ],
      },
    ],
  },
  {
    id: 'solarius',
    name: 'Solarius',
    portraitUrl: portraits.light,
    elementType: 'light',
    maxHp: 3200,
    abilities: [
      {
        id: 'radiant-touch',
        version: 1,
        kind: 'active',
        name: 'Radiant Touch',
        description: 'Превращает два выбранных куба в Свет и восстанавливает 35 HP.',
        iconUrl: elementIcon('light'),
        unlockLevel: 1,
        activation: { type: 'manual', energyCost: 40, usageLimit: { perRound: 1 } },
        fieldEffect: { type: 'convert', elementType: 'light', targetCount: 2 },
        effects: [
          {
            type: 'heal',
            target: 'self',
            value: { type: 'constant', value: 35 },
            timing: 'round-resolution',
          },
        ],
      },
      {
        id: 'beacon',
        version: 1,
        kind: 'passive',
        name: 'Beacon',
        description: 'Пассивная связь со Светом. Автоматический эффект будет добавлен позднее.',
        iconUrl: elementIcon('light'),
        unlockLevel: 1,
        activation: { type: 'automatic' },
        effects: [],
      },
      {
        id: 'daybreak',
        version: 1,
        kind: 'ultimate',
        name: 'Daybreak',
        description: 'Поворачивает центральный или крайние сегменты и восстанавливает 90 HP.',
        iconUrl: textureIcon('lightning'),
        unlockLevel: 1,
        activation: { type: 'manual', energyCost: 100, usageLimit: { perBattle: 1 } },
        fieldEffect: {
          type: 'rotateSegment',
          orientation: 'horizontal',
          pattern: 'centerOrEdges',
          oppositeRotation: true,
        },
        effects: [
          {
            type: 'heal',
            target: 'self',
            value: { type: 'constant', value: 90 },
            timing: 'round-resolution',
          },
        ],
      },
    ],
  },
  {
    id: 'pyraxis',
    name: 'Pyraxis',
    portraitUrl: portraits.fire,
    elementType: 'fire',
    maxHp: 3200,
    abilities: [
      {
        id: 'ignite',
        version: 1,
        kind: 'active',
        name: 'Ignite',
        description: 'Превращает два выбранных куба в Огонь и добавляет 35 огненного урона.',
        iconUrl: elementIcon('fire'),
        unlockLevel: 1,
        activation: { type: 'manual', energyCost: 40, usageLimit: { perRound: 1 } },
        fieldEffect: { type: 'convert', elementType: 'fire', targetCount: 2 },
        effects: [
          {
            type: 'deal-damage',
            target: 'enemy',
            channel: 'fire',
            value: { type: 'constant', value: 35 },
            timing: 'round-resolution',
          },
        ],
      },
      {
        id: 'inner-flame',
        version: 1,
        kind: 'passive',
        name: 'Inner Flame',
        description: 'Пассивная связь с Огнём. Автоматический эффект будет добавлен позднее.',
        iconUrl: elementIcon('fire'),
        unlockLevel: 1,
        activation: { type: 'automatic' },
        effects: [],
      },
      {
        id: 'inferno',
        version: 1,
        kind: 'ultimate',
        name: 'Inferno',
        description: 'Вращает разнесённые сегменты в разные стороны и наносит 120 огненного урона.',
        iconUrl: textureIcon('bomb'),
        unlockLevel: 1,
        activation: { type: 'manual', energyCost: 100, usageLimit: { perBattle: 1 } },
        fieldEffect: {
          type: 'rotateSegment',
          orientation: 'vertical',
          pattern: 'gap',
          oppositeRotation: true,
        },
        effects: [
          {
            type: 'deal-damage',
            target: 'enemy',
            channel: 'fire',
            value: { type: 'constant', value: 120 },
            timing: 'round-resolution',
          },
        ],
      },
    ],
  },
  {
    id: 'terranox',
    name: 'Terranox',
    portraitUrl: portraits.earth,
    elementType: 'earth',
    maxHp: 3200,
    abilities: [
      {
        id: 'stonebind',
        version: 1,
        kind: 'active',
        name: 'Stonebind',
        description: 'Превращает два выбранных куба в Землю и усиливает земную защиту на 35%.',
        iconUrl: elementIcon('earth'),
        unlockLevel: 1,
        activation: { type: 'manual', energyCost: 40, usageLimit: { perRound: 1 } },
        fieldEffect: { type: 'convert', elementType: 'earth', targetCount: 2 },
        effects: [
          {
            type: 'modify-stat',
            target: 'self',
            stat: 'earthDefensePower',
            operation: 'percent-add',
            value: { type: 'constant', value: 0.35 },
            duration: { type: 'until-round-end' },
            timing: 'round-resolution',
          },
        ],
      },
      {
        id: 'bedrock',
        version: 1,
        kind: 'passive',
        name: 'Bedrock',
        description: 'Пассивная связь с Землёй. Автоматический эффект будет добавлен позднее.',
        iconUrl: elementIcon('earth'),
        unlockLevel: 1,
        activation: { type: 'automatic' },
        effects: [],
      },
      {
        id: 'fault-line',
        version: 1,
        kind: 'ultimate',
        name: 'Fault Line',
        description:
          'Вращает соседние сегменты, усиливает земную защиту и наносит 80 истинного урона.',
        iconUrl: textureIcon('bomb'),
        unlockLevel: 1,
        activation: { type: 'manual', energyCost: 100, usageLimit: { perBattle: 1 } },
        fieldEffect: {
          type: 'rotateSegment',
          orientation: 'horizontal',
          pattern: 'adjacent',
          oppositeRotation: true,
        },
        effects: [
          {
            type: 'modify-stat',
            target: 'self',
            stat: 'earthDefensePower',
            operation: 'percent-add',
            value: { type: 'constant', value: 0.5 },
            duration: { type: 'until-round-end' },
            timing: 'round-resolution',
          },
          {
            type: 'deal-damage',
            target: 'enemy',
            channel: 'true',
            value: { type: 'constant', value: 80 },
            timing: 'round-resolution',
          },
        ],
      },
    ],
  },
] as const satisfies readonly CombatantDefinition[]

export function getHeroById(heroId: string): CombatantDefinition | undefined {
  return heroCatalog.find(({ id }) => id === heroId)
}

function requireHero(heroId: string): CombatantDefinition {
  const hero = getHeroById(heroId)
  if (!hero) throw new Error(`Не найден герой ${heroId}`)
  return hero
}

export const defaultPlayerHero = requireHero('shadow-rift')
export const defaultOpponentHero = requireHero('valexey')
