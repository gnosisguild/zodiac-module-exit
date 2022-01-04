export enum Network {
  MAINNET = 1,
  RINKEBY = 4,
}

export interface MainState {
  chainId: Network
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
