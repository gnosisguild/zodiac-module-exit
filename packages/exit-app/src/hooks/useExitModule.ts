import { useEffect, useState } from 'react'
import { getProvider } from '../services/web3'
import { filterExitModule } from '../services/module'

export function useExitModule() {
  // const { safe, sdk } = useSafeAppsSDK()
  // sdk.safe.experimental_getBalances().then(console.log)

  const [module, setModule] = useState<string>()
  const [loading, setLoading] = useState(false)

  // const { provider } = useWallet()

  useEffect(() => {
    const exec = async () => {
      setLoading(true)
      //TODO: Update
      const provider = getProvider(4)
      // const modules = await getSafeModules(provider, '')
      const exitModule = await filterExitModule(provider, [])
      setModule(exitModule)
      setLoading(false)
    }
    exec()
  }, [])

  return { module, loading }
}
