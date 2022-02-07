import Onboard from 'bnc-onboard'
import { ethers } from 'ethers'
import { REDUX_STORE, useRootSelector } from '../store'
import { resetWallet, setChainId, setENS, setWallet } from '../store/main'
import { useEffect, useMemo, useState } from 'react'
import { getChainId } from '../store/main/selectors'
import SafeAppsSDK from '@gnosis.pm/safe-apps-sdk'
import { getNetworkRPC } from '../utils/networks'
import memoize from 'lodash.memoize'
import { useParams } from 'react-router-dom'
import { getAddress } from '../utils/address'
import { ExternalProvider } from '@ethersproject/providers'

const ONBOARD_JS_DAPP_ID = process.env.REACT_APP_ONBOARD_JS_DAPP_ID
const INFURA_KEY = process.env.REACT_APP_INFURA_KEY

export let _signer: ethers.providers.JsonRpcSigner

const safeSDK = new SafeAppsSDK()
safeSDK.getSafeInfo().then(async (safeInfo) => {
  REDUX_STORE.dispatch(setChainId(safeInfo.chainId))
})

const configureOnboardJS = memoize(
  (networkId: number) => {
    const rpcUrl = getNetworkRPC(networkId)
    const wallets = [
      { walletName: 'metamask', preferred: true },
      { walletName: 'gnosis', preferred: true },
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
            setProvider(wallet.provider)
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
  const _chainId = useRootSelector(getChainId)
  const { account } = useParams()

  const chainId = useMemo(() => {
    if (account) {
      const address = getAddress(account)
      if (address && address[1]) return address[1]
    }
    return _chainId
  }, [_chainId, account])

  const onboard = useMemo(() => configureOnboardJS(chainId), [chainId])
  const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider>()
  const [signer, setSigner] = useState<ethers.Signer>()

  const startOnboard = async () => {
    try {
      const selected = await onboard.walletSelect()
      if (selected) {
        await onboard.walletCheck()
        setSigner(_signer)
      }
    } catch (err) {
      console.warn('startOnboard error', err)
    }
  }

  useEffect(() => {
    const rpcUrl = getNetworkRPC(chainId)
    const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl, chainId)
    setProvider(provider)
  }, [chainId])

  return { provider, signer, onboard, startOnboard }
}

export function setProvider(provider: ExternalProvider) {
  const web3Provider = new ethers.providers.Web3Provider(provider)
  _signer = web3Provider.getSigner()
  return _signer
}
