export type MainPageCurrencyId = 'gems' | 'coins'

export interface MainPageHeaderProfileModel {
  readonly playerName: string
  readonly portraitUrl: string
  readonly rating: number
  readonly level: number
  readonly experience: {
    readonly current: number
    readonly required: number
  }
}

export interface MainPageHeaderModel {
  readonly currencies: Readonly<Record<MainPageCurrencyId, number>>
  readonly playerName: string
  readonly portraitUrl: string
  readonly rating: number
  readonly level: number
  readonly experience: MainPageHeaderProfileModel['experience']
}
