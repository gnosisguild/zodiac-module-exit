import { NETWORK } from '../../utils/networks'

export interface MainState {
  chainId: NETWORK
  loading: boolean
  account?: string
  module?: string
  wallet?: string
  ens?: string
  token?: Token
  assets: SafeAssets
  claimAmount: string
  circulatingSupply?: {
    address: string
    value: string
  }
  selectedTokens: string[]
}
export enum TokenType {
  NATIVE_TOKEN,
  ERC20,
}

export interface Token {
  type: TokenType
  address: string
  decimals: number
  symbol: string
  name?: string
  logoUri?: string
}

export interface SafeAssets {
  fiatTotal: string
  items: TokenAsset[]
}

export interface TokenAsset {
  tokenInfo: Token
  gas: string
  balance: string
  fiatBalance: string
  fiatConversion: string
}
