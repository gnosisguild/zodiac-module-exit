import Onboard from 'bnc-onboard'
import { ethers } from 'ethers'
import { REDUX_STORE, useRootSelector } from '../store'
import { resetWallet, setENS, setWallet } from '../store/main'
import { useEffect, useMemo, useState } from 'react'
import { getChainId, getWalletAddress } from '../store/main/selectors'

const ONBOARD_JS_DAPP_ID = process.env.REACT_APP_ONBOARD_JS_DAPP_ID
const INFURA_KEY = process.env.REACT_APP_INFURA_KEY

let _provider: ethers.providers.JsonRpcProvider

const configureOnboardJS = (networkId: number) => {
  _provider = new ethers.providers.InfuraProvider(networkId, INFURA_KEY)
  const RPC_URL = _provider.connection.url

  const wallets = [
    { walletName: 'metamask', preferred: true },
    { walletName: 'gnosis', preferred: true },
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
        console.log('wallet', wallet)
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
      network(chainId) {
        console.log('chainId', chainId)
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
    const selected = await onboard.walletSelect()
    if (selected) await onboard.walletCheck()
    setProvider(_provider)
  }

  useEffect(() => {
    setProvider(_provider)
  }, [wallet])

  return { provider, startOnboard }
}
