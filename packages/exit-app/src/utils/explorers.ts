import { NETWORK } from './networks'

const REACT_APP_ETHERSCAN_KEY = process.env.REACT_APP_ETHERSCAN_KEY

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
  [NETWORK.RINKEBY]: {
    networkExplorerName: 'Etherscan',
    networkExplorerUrl: 'https://rinkeby.etherscan.io',
    networkExplorerApiUrl: 'https://api-rinkeby.etherscan.io/api',
    safeTransactionApi: 'https://safe-transaction.rinkeby.gnosis.io/',
    safeUrl: 'https://gnosis-safe.io/app/rin:',
    verifyContractUrl: 'https://rinkeby.etherscan.io/verifyContract',
    explorerApiKey: REACT_APP_ETHERSCAN_KEY,
  },
  [NETWORK.GNOSIS_CHAIN]: {
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
