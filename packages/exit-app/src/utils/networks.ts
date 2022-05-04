import { InitOptions } from '@web3-onboard/core'

export enum NETWORK {
  MAINNET = 1,
  RINKEBY = 4,
  BSC = 56,
  GNOSIS_CHAIN = 100,
  POLYGON = 137,
}

export interface Coin {
  symbol: string
  decimals: number
}

export const NETWORK_CHAIN_ID: Record<NETWORK, string> = {
  [NETWORK.MAINNET]: '0x1',
  [NETWORK.RINKEBY]: '0x4',
  [NETWORK.POLYGON]: '0x89',
  [NETWORK.GNOSIS_CHAIN]: '0x64',
  [NETWORK.BSC]: '0x38',
}

export const NATIVE_ASSET: Record<string, Coin> = {
  ETH: { symbol: 'ETH', decimals: 18 },
  XDAI: { symbol: 'XDAI', decimals: 18 },
  MATIC: { symbol: 'MATIC', decimals: 18 },
  BNB: { symbol: 'BNB', decimals: 18 },
}

export const NETWORK_NATIVE_ASSET: Record<NETWORK, Coin> = {
  [NETWORK.MAINNET]: NATIVE_ASSET.ETH,
  [NETWORK.RINKEBY]: NATIVE_ASSET.ETH,
  [NETWORK.BSC]: NATIVE_ASSET.BNB,
  [NETWORK.GNOSIS_CHAIN]: NATIVE_ASSET.XDAI,
  [NETWORK.POLYGON]: NATIVE_ASSET.MATIC,
}

export const NETWORK_NAME: Record<NETWORK, string> = {
  [NETWORK.MAINNET]: 'Mainnet',
  [NETWORK.RINKEBY]: 'Rinkeby',
  [NETWORK.BSC]: 'Binance Smart Chain',
  [NETWORK.GNOSIS_CHAIN]: 'Gnosis Chain',
  [NETWORK.POLYGON]: 'Polygon',
}

export const NETWORK_DEFAULT_RPC: Record<NETWORK, string> = {
  [NETWORK.MAINNET]: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  [NETWORK.RINKEBY]: 'https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  [NETWORK.BSC]: 'https://bsc-dataseed.binance.org',
  [NETWORK.GNOSIS_CHAIN]: 'https://rpc.gnosischain.com',
  [NETWORK.POLYGON]: 'https://polygon-rpc.com',
}

export function getNetworkNativeAsset(network: NETWORK) {
  return NETWORK_NATIVE_ASSET[network]
}

export function getNetworkRPC(network: NETWORK) {
  return NETWORK_DEFAULT_RPC[network]
}

export function getNetworkName(network: NETWORK) {
  return NETWORK_NAME[network]
}

export const CHAIN_CONFIG: InitOptions['chains'] = [
  {
    id: NETWORK_CHAIN_ID[NETWORK.MAINNET],
    token: NETWORK_NATIVE_ASSET[NETWORK.MAINNET].symbol,
    label: NETWORK_NAME[NETWORK.MAINNET],
    rpcUrl: NETWORK_DEFAULT_RPC[NETWORK.MAINNET],
  },
  {
    id: NETWORK_CHAIN_ID[NETWORK.RINKEBY],
    token: NETWORK_NATIVE_ASSET[NETWORK.RINKEBY].symbol,
    label: NETWORK_NAME[NETWORK.RINKEBY],
    rpcUrl: NETWORK_DEFAULT_RPC[NETWORK.RINKEBY],
  },
  {
    id: NETWORK_CHAIN_ID[NETWORK.BSC],
    token: NETWORK_NATIVE_ASSET[NETWORK.BSC].symbol,
    label: NETWORK_NAME[NETWORK.BSC],
    rpcUrl: NETWORK_DEFAULT_RPC[NETWORK.BSC],
  },
  {
    id: NETWORK_CHAIN_ID[NETWORK.GNOSIS_CHAIN],
    token: NETWORK_NATIVE_ASSET[NETWORK.GNOSIS_CHAIN].symbol,
    label: NETWORK_NAME[NETWORK.GNOSIS_CHAIN],
    rpcUrl: NETWORK_DEFAULT_RPC[NETWORK.GNOSIS_CHAIN],
  },
  {
    id: NETWORK_CHAIN_ID[NETWORK.POLYGON],
    token: NETWORK_NATIVE_ASSET[NETWORK.POLYGON].symbol,
    label: NETWORK_NAME[NETWORK.POLYGON],
    rpcUrl: NETWORK_DEFAULT_RPC[NETWORK.POLYGON],
  },
]
