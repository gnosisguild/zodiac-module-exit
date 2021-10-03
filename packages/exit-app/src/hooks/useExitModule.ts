import { useEffect, useState } from 'react'
import { getSafeModules } from '../services/safe'
import { useSafeAppsSDK } from '@gnosis.pm/safe-apps-react-sdk'
import { getProvider } from '../services/web3'
import { filterExitModule } from '../services/module'
import { ethers } from 'ethers'

export function useExitModule() {
  const { safe, sdk } = useSafeAppsSDK()
  sdk.safe.experimental_getBalances().then(console.log)

  const [module, setModule] = useState<string>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const exec = async () => {
      const provider1 = new ethers.providers.Web3Provider((window as any).ethereum, 'any')
      // Prompt user for account connections
      await provider1.send('eth_requestAccounts', [])
      const signer = provider1.getSigner()
      console.log('signer', signer)

      setLoading(true)
      const provider = getProvider(safe.chainId)
      const modules = await getSafeModules(provider, safe.safeAddress)
      const exitModule = await filterExitModule(provider, modules)
      setModule(exitModule)
      setLoading(false)
    }
    exec()
  }, [safe])

  return { module, loading }
}
