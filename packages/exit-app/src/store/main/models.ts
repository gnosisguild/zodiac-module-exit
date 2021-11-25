export interface MainState {
  account?: string
  wallet?: string
  ens?: string
  token?: {
    symbol: string
    address: string
    decimals: number
  }
  circulatingSupply?: {
    address: string
    value: string
  }
}
