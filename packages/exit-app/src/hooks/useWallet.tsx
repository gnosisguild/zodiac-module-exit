import Onboard from 'bnc-onboard'
import { ethers } from 'ethers'
import { REDUX_STORE, useRootSelector } from '../store'
import { resetWallet, setAccount, setChainId, setENS, setWallet } from '../store/main'
import { useEffect, useMemo, useState } from 'react'
import { getChainId, getWalletAddress } from '../store/main/selectors'
import SafeAppsSDK from '@gnosis.pm/safe-apps-sdk'
import { SafeAppProvider } from '@gnosis.pm/safe-apps-provider'
import { getExitModulesFromSafe } from '../services/module'
import { getNetworkRPC } from '../utils/networks'
import memoize from 'lodash.memoize'

const ONBOARD_JS_DAPP_ID = process.env.REACT_APP_ONBOARD_JS_DAPP_ID
const INFURA_KEY = process.env.REACT_APP_INFURA_KEY

let _provider: ethers.providers.JsonRpcProvider | undefined

const safeSDK = new SafeAppsSDK()
safeSDK.getSafeInfo().then(async (safeInfo) => {
  try {
    const safeProvider = new SafeAppProvider(safeInfo, safeSDK)
    _provider = new ethers.providers.Web3Provider(safeProvider)
    const exitModule = await getExitModulesFromSafe(_provider, safeInfo.safeAddress)
    REDUX_STORE.dispatch(setAccount({ account: safeInfo.safeAddress, module: exitModule }))
    REDUX_STORE.dispatch(setChainId(safeInfo.chainId))
  } catch (err) {
    console.warn('could get safe modules using gnosis safe-apps-sdk', err)
  }
})

const configureOnboardJS = memoize(
  (networkId: number) => {
    const rpcUrl = getNetworkRPC(networkId)
    _provider = new ethers.providers.JsonRpcProvider(rpcUrl, networkId)

    const wallets = [
      { walletName: 'metamask', preferred: true },
      { walletName: 'coinbase', preferred: true },
      { walletName: 'ledger', rpcUrl: rpcUrl, preferred: true },
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
  },
  (chainId) => chainId.toString(),
)

export const useWallet = () => {
  const chainId = useRootSelector(getChainId)
  const wallet = useRootSelector(getWalletAddress)

  const onboard = useMemo(() => configureOnboardJS(chainId), [chainId])
  const [provider, setProvider] = useState(_provider)

  const startOnboard = async () => {
    try {
      const selected = await onboard.walletSelect()
      if (selected) await onboard.walletCheck()
      setProvider(_provider)
    } catch (err) {
      console.warn('startOnboard error', err)
    }
  }

  useEffect(() => {
    if (_provider) setProvider(_provider)
  }, [chainId, wallet])

  return { provider, startOnboard }
}
