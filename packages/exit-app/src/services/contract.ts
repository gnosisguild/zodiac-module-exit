import retry from 'async-retry'
import memoize from 'lodash.memoize'
import { getNetworkExplorerInfo } from '../utils/explorers'
import { httpCacheClient } from './http'

export const fetchContractSourceCode = memoize(
  (chainId: number, contractAddress: string) =>
    retry(
      async (bail) => {
        const network = getNetworkExplorerInfo(chainId)

        if (!network) {
          const error = new Error('Network data not found')
          bail(error)
          throw error
        }

        const { apiUrl, apiKey } = network

        const urlParams: Record<string, string> = {
          module: 'contract',
          action: 'getsourcecode',
          address: contractAddress,
        }

        if (apiKey) {
          urlParams.apiKey = apiKey
        }

        const params = new URLSearchParams(urlParams)

        const response = await httpCacheClient.get(`${apiUrl}?${params}`)
        const { status, result } = response.data

        if (status === '0') {
          const error = new Error('Could not fetch contract source code')
          bail(error)
          throw error
        }

        const data = result[0] as { ABI: string; ContractName: string }

        if (!data.ContractName) {
          const error = new Error('Contract is not verified')
          bail(error)
          throw error
        }

        return data
      },
      { retries: 4, minTimeout: 1000 },
    ),
  (chainId: number, contractAddress: string) => `${chainId}_${contractAddress}`,
)
