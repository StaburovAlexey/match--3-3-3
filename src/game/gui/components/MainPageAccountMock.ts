import accountPortrait from '../assets/main-page/account-profile-portrait.svg'
import type { MainPageHeaderModel } from './MainPageHeaderTypes.ts'

export const mockMainPageAccount: MainPageHeaderModel = {
  playerName: 'KraftHP',
  portraitUrl: accountPortrait,
  rating: 1000,
  level: 23123,
  experience: { current: 842, required: 1000 },
  currencies: { gems: 14163, coins: 28156 },
}
