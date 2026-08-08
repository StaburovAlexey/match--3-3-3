export type MainPageTabId = 'shop' | 'collection' | 'battle' | 'locked' | 'upgrade'

export interface MainPageTabDefinition {
  readonly id: MainPageTabId
  readonly label: string
  readonly placeholder: string
}

export const mainPageTabs: readonly MainPageTabDefinition[] = [
  { id: 'shop', label: 'Магазин', placeholder: 'Новые товары скоро появятся.' },
  { id: 'collection', label: 'Коллекция', placeholder: 'Коллекция героев скоро откроется.' },
  { id: 'battle', label: 'Битва', placeholder: '' },
  { id: 'locked', label: 'Закрыто', placeholder: 'Этот раздел пока закрыт.' },
  { id: 'upgrade', label: 'Улучшение', placeholder: 'Улучшения скоро станут доступны.' },
] as const
