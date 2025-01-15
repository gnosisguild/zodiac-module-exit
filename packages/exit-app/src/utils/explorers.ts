import { NETWORK } from './networks'

const REACT_APP_ETHERSCAN_KEY = process.env.REACT_APP_ETHERSCAN_KEY
const REACT_APP_OPTIMISTIC_ETHERSCAN_KEY = process.env.REACT_APP_OPTIMISTIC_ETHERSCAN_KEY
const REACT_APP_ARBISCAN_KEY = process.env.REACT_APP_ARBISCAN_KEY
const REACT_APP_SNOWTRACE_KEY = process.env.REACT_APP_SNOWTRACE_KEY

interface ExplorerData {
  networkExplorerName: string
  networkExplorerUrl: string
  networkExplorerApiUrl: string
  safeTransactionApi: string
  safeUrl: string
  explorerApiKey?: string
  verifyContractUrl: string
}

export const EXPLORERS_CONFIG: Record<NETWORK, ExplorerData> = {
  [NETWORK.MAINNET]: {
    networkExplorerName: 'Etherscan',
    networkExplorerUrl: 'https://etherscan.io',
    networkExplorerApiUrl: 'https://api.etherscan.io/api',
    safeTransactionApi: 'https://safe-transaction.gnosis.io/',
    safeUrl: 'https://gnosis-safe.io/app/eth:',
    verifyContractUrl: 'https://etherscan.io/verifyContract',
    explorerApiKey: REACT_APP_ETHERSCAN_KEY,
  },
  [NETWORK.SEPOLIA]: {
    networkExplorerName: 'Etherscan',
    networkExplorerUrl: 'https://sepolia.etherscan.io',
    networkExplorerApiUrl: 'https://api-sepolia.etherscan.io/api',
    safeTransactionApi: 'https://safe-transaction.sepolia.gnosis.io/',
    safeUrl: 'https://gnosis-safe.io/app/sep:',
    verifyContractUrl: 'https://sepolia.etherscan.io/verifyContract',
    explorerApiKey: REACT_APP_ETHERSCAN_KEY,
  },
  [NETWORK.XDAI]: {
    networkExplorerName: 'Blockscout',
    networkExplorerUrl: 'https://blockscout.com/poa/xdai',
    networkExplorerApiUrl: 'https://blockscout.com/xdai/mainnet/api',
    safeUrl: 'https://gnosis-safe.io/app/gno:',
    safeTransactionApi: 'https://safe-transaction.xdai.gnosis.io/',
    verifyContractUrl: 'https://docs.blockscout.com/for-users/smart-contract-interaction/verifying-a-smart-contract',
  },
  [NETWORK.POLYGON]: {
    networkExplorerName: 'Polygonscan',
    networkExplorerUrl: 'https://polygonscan.com',
    networkExplorerApiUrl: 'https://api.polygonscan.com/api',
    safeUrl: 'https://gnosis-safe.io/app/matic:',
    safeTransactionApi: 'https://safe-transaction.polygon.gnosis.io/',
    verifyContractUrl: 'https://polygonscan.com/verifyContract',
    explorerApiKey: REACT_APP_ETHERSCAN_KEY,
  },
  [NETWORK.BSC]: {
    networkExplorerName: 'Bscscan',
    networkExplorerUrl: 'https://bscscan.com/',
    networkExplorerApiUrl: 'https://bscscan.com/api',
    safeUrl: 'https://gnosis-safe.io/app/bsc:',
    safeTransactionApi: 'https://safe-transaction.bsc.gnosis.io/',
    verifyContractUrl: 'https://bscscan.com/verifyContract',
    explorerApiKey: REACT_APP_ETHERSCAN_KEY,
  },
  [NETWORK.OPTIMISM]: {
    networkExplorerName: 'Etherscan',
    networkExplorerUrl: 'https://optimistic.etherscan.io/',
    networkExplorerApiUrl: 'https://api-optimistic.etherscan.io/api',
    safeTransactionApi: 'https://safe-transaction-optimism.safe.global/',
    safeUrl: 'https://app.safe.global/home?safe=oeth:',
    verifyContractUrl: 'https://optimistic.etherscan.io/verifyContract',
    explorerApiKey: REACT_APP_OPTIMISTIC_ETHERSCAN_KEY,
  },
  [NETWORK.ARBITRUMONE]: {
    networkExplorerName: 'Arbiscan',
    networkExplorerUrl: 'https://arbiscan.io/',
    networkExplorerApiUrl: 'https://api.arbiscan.io/api',
    safeTransactionApi: 'https://safe-transaction-arbitrum.safe.global/',
    safeUrl: 'https://app.safe.global/home?safe=arb1:',
    verifyContractUrl: 'https://arbiscan.io/verifyContract',
    explorerApiKey: REACT_APP_ARBISCAN_KEY,
  },
  [NETWORK.AVALANCHE]: {
    networkExplorerName: 'Snowtrace',
    networkExplorerUrl: 'https://snowtrace.io/',
    networkExplorerApiUrl: 'https://api.snowtrace.io/api',
    safeTransactionApi: 'https://safe-transaction-arbitrum.safe.global/',
    safeUrl: 'https://app.safe.global/home?safe=avax:',
    verifyContractUrl: 'https://snowtrace.io/verifyContract',
    explorerApiKey: REACT_APP_SNOWTRACE_KEY,
  },
}

export const getNetworkExplorerInfo = (chainId: number) => {
  const networkBaseConfig = EXPLORERS_CONFIG[chainId as NETWORK]
  if (!networkBaseConfig) return
  return {
    name: networkBaseConfig.networkExplorerName,
    url: networkBaseConfig.networkExplorerUrl,
    apiUrl: networkBaseConfig.networkExplorerApiUrl,
    apiKey: networkBaseConfig.explorerApiKey,
    safeTransactionApi: networkBaseConfig.safeTransactionApi,
    safeUrl: networkBaseConfig.safeUrl,
    verifyUrl: networkBaseConfig.verifyContractUrl,
  }
}
