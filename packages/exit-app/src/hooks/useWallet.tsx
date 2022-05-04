import { BigNumber, ethers } from 'ethers'
import { REDUX_STORE, useRootDispatch, useRootSelector } from '../store'
import { resetWallet, setChainId, setENS, setWallet } from '../store/main'
import { useEffect, useMemo, useState } from 'react'
import { getChainId, getWalletAddress } from '../store/main/selectors'
import SafeAppsSDK from '@gnosis.pm/safe-apps-sdk'
import { CHAIN_CONFIG, getNetworkRPC, NETWORK, NETWORK_CHAIN_ID } from '../utils/networks'
import { useParams } from 'react-router-dom'
import { getAddress } from '../utils/address'
import { ExternalProvider } from '@ethersproject/providers'

import { init, useConnectWallet, useSetChain } from '@web3-onboard/react'
import injectedModule from '@web3-onboard/injected-wallets'
import ledgerModule from '@web3-onboard/ledger'
import walletConnectModule from '@web3-onboard/walletconnect'
import walletLinkModule from '@web3-onboard/walletlink'
import torusModule from '@web3-onboard/torus'
import gnosisModule from '@web3-onboard/gnosis'

export let _signer: ethers.providers.JsonRpcSigner

const injected = injectedModule()
const walletLink = walletLinkModule()
const walletConnect = walletConnectModule()
const torus = torusModule()
const ledger = ledgerModule()
const gnosis = gnosisModule()

const onboard = init({
  accountCenter: {
    desktop: {
      enabled: false,
    },
  },
  wallets: [gnosis, ledger, walletConnect, walletLink, injected, torus],
  chains: CHAIN_CONFIG,
})

const safeSDK = new SafeAppsSDK()
safeSDK.safe.getInfo().then(async (safeInfo) => {
  await onboard.connectWallet({ autoSelect: { label: 'Gnosis Safe', disableModals: true } })
  REDUX_STORE.dispatch(setChainId(safeInfo.chainId))
})

export const useWallet = () => {
  const { account } = useParams()
  const [, setChain] = useSetChain()
  const [walletConfig, connect] = useConnectWallet()
  const dispatch = useRootDispatch()
  const walletAddress = useRootSelector(getWalletAddress)

  const _chainId = useRootSelector(getChainId)

  const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider>()
  const [signer, setStateSinger] = useState<ethers.Signer>()

  const chainId = useMemo((): NETWORK => {
    if (account) {
      const address = getAddress(account)
      if (address && address[1]) return address[1]
    }
    return _chainId
  }, [_chainId, account])

  useEffect(() => {
    if (walletConfig.wallet) {
      const { accounts, chains, provider } = walletConfig.wallet
      const { ens, address } = accounts[0]
      dispatch(setWallet(address))
      setSigner(provider)
      setStateSinger(_signer)
      if (ens) dispatch(setENS(ens.name))

      // Check current network
      const checkConnectedChain = chains.some((chain) => BigNumber.from(chain.id).toNumber() === chainId)
      if (!checkConnectedChain) {
        setChain({ chainId: NETWORK_CHAIN_ID[chainId] })
      }
    } else if (walletAddress) {
      dispatch(resetWallet())
    }
  }, [chainId, dispatch, setChain, walletAddress, walletConfig.wallet])

  const startOnboard = () => {
    return connect({})
  }

  useEffect(() => {
    const rpcUrl = getNetworkRPC(chainId)
    const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl, chainId)
    setProvider(provider)
  }, [chainId])

  return { provider, signer, onboard, startOnboard }
}

export function setSigner(provider: ExternalProvider) {
  const web3Provider = new ethers.providers.Web3Provider(provider)
  _signer = web3Provider.getSigner()
  return _signer
}
