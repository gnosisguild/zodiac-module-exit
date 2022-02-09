import { NETWORK } from '../../utils/networks'

export interface MainState {
  chainId: NETWORK
  loading: boolean
  type?: ModuleType
  account?: string
  module?: string
  wallet?: string
  ens?: string
  token?: Token
  assets: SafeAssets
  balance?: string
  claimAmount: string
  claimToken?: string
  circulatingSupply?: {
    address: string
    value: string
  }
  selectedTokens: string[]
  availableTokens: AvailableToken[]
  customTokens: Token[]
  step: EXIT_STEP
}

export enum TokenType {
  NATIVE_TOKEN,
  ERC20,
  ERC721,
}

export interface AvailableToken {
  tokenId: string
  tokenUri: string
  imgUrl?: string
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

export enum ModuleType {
  ERC20,
  ERC721,
}

export enum EXIT_STEP {
  EXIT,
  APPROVE,
  APPROVING,
  WAITING,
  EXITED,
  TX_CREATED,
  ERROR,
}
