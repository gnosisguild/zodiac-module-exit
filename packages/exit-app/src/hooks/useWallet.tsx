import Onboard from 'bnc-onboard'
import { ethers } from 'ethers'
import { REDUX_STORE, useRootSelector } from '../store'
import { resetWallet, setAccount, setChainId, setENS, setWallet } from '../store/main'
import { useEffect, useMemo, useState } from 'react'
import { getChainId, getWalletAddress } from '../store/main/selectors'
import SafeAppsSDK from '@gnosis.pm/safe-apps-sdk'
import { getExitModulesFromSafe } from '../services/module'

const ONBOARD_JS_DAPP_ID = process.env.REACT_APP_ONBOARD_JS_DAPP_ID
const INFURA_KEY = process.env.REACT_APP_INFURA_KEY

let _provider: ethers.providers.JsonRpcProvider

const safe = new SafeAppsSDK()
safe.getSafeInfo().then(async (safeInfo) => {
  try {
    const exitModule = await getExitModulesFromSafe(_provider, safeInfo.safeAddress)
    REDUX_STORE.dispatch(setAccount({ account: safeInfo.safeAddress, module: exitModule }))
    REDUX_STORE.dispatch(setChainId(safeInfo.chainId))
  } catch (err) {
    console.warn('could get safe modules using gnosis safe-apps-sdk', err)
  }
})

const configureOnboardJS = (networkId: number) => {
  _provider = new ethers.providers.InfuraProvider(networkId, INFURA_KEY)
  const RPC_URL = _provider.connection.url

  const wallets = [
    { walletName: 'metamask', preferred: true },
    { walletName: 'coinbase', preferred: true },
    { walletName: 'ledger', rpcUrl: RPC_URL, preferred: true },
    { walletName: 'walletConnect', infuraKey: INFURA_KEY, preferred: true },
    { walletName: 'opera' },
    { walletName: 'operaTouch' },
  ]

  return Onboard({
    networkId,
    dappId: ONBOARD_JS_DAPP_ID,
    darkMode: true,
    subscriptions: {
      wallet: (wallet) => {
        if (wallet.provider) {
          _provider = new ethers.providers.Web3Provider(wallet.provider)
        }
      },
      address(address) {
        console.log('address', address)
        if (address) {
          REDUX_STORE.dispatch(setWallet(address))
        } else {
          REDUX_STORE.dispatch(resetWallet())
        }
      },
      ens(ens) {
        if (ens && ens.name) {
          REDUX_STORE.dispatch(setENS(ens.name))
        }
      },
    },
    walletSelect: {
      wallets,
    },
    walletCheck: [
      { checkName: 'derivationPath' },
      { checkName: 'accounts' },
      { checkName: 'connect' },
      { checkName: 'network' },
    ],
  })
}

export const useWallet = () => {
  const chainId = useRootSelector(getChainId)

  const onboard = useMemo(() => configureOnboardJS(chainId), [chainId])
  const [provider, setProvider] = useState(_provider)
  const wallet = useRootSelector(getWalletAddress)

  const startOnboard = async () => {
    try {
      console.log('123', 123)
      const selected = await onboard.walletSelect()
      console.log('selected', selected)
      if (selected) await onboard.walletCheck()
      setProvider(_provider)
    } catch (err) {
      console.warn('err', err)
    }
  }

  useEffect(() => {
    setProvider(_provider)
  }, [wallet])

  return { provider, startOnboard }
}
