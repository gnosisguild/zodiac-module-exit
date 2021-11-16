import { useEffect, useState } from 'react'
import Onboard from 'bnc-onboard'
import { ethers } from 'ethers'

const ONBOARD_JS_DAPP_ID = process.env.REACT_APP_ONBOARD_JS_DAPP_ID
const INFURA_KEY = process.env.REACT_APP_INFURA_KEY

let provider: ethers.providers.Web3Provider

const RPC_URL = 'https://<network>.infura.io/v3/<INFURA_KEY>'
const wallets = [
  { walletName: 'coinbase', preferred: true },
  { walletName: 'trust', preferred: true, rpcUrl: RPC_URL },
  { walletName: 'metamask', preferred: true },
  { walletName: 'authereum' },
  {
    walletName: 'ledger',
    rpcUrl: RPC_URL,
  },
  {
    walletName: 'keepkey',
    rpcUrl: RPC_URL,
  },
  {
    walletName: 'walletConnect',
    infuraKey: INFURA_KEY,
  },
  { walletName: 'opera' },
  { walletName: 'operaTouch' },
  { walletName: 'torus' },
  { walletName: 'status' },
  { walletName: 'imToken', rpcUrl: RPC_URL },
  { walletName: 'meetone' },
  { walletName: 'mykey', rpcUrl: RPC_URL },
  { walletName: 'huobiwallet', rpcUrl: RPC_URL },
  { walletName: 'hyperpay' },
  { walletName: 'wallet.io', rpcUrl: RPC_URL },
  { walletName: 'atoken' },
  { walletName: 'frame' },
  { walletName: 'ownbit' },
  { walletName: 'alphawallet' },
  { walletName: 'gnosis', preferred: true },
  { walletName: 'xdefi' },
  { walletName: 'bitpie' },
  { walletName: 'binance', preferred: true },
  { walletName: 'liquality' },
]

export const useWallet = () => {
  const chainId = 4

  const [onboard] = useState(() => {
    return Onboard({
      dappId: ONBOARD_JS_DAPP_ID,
      networkId: chainId,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      networkName: chainId === 137 ? 'polygon' : undefined,
      subscriptions: {
        wallet: (wallet) => {
          console.log('before', { wallet, provider })
          if (wallet.provider) {
            provider = new ethers.providers.Web3Provider(wallet.provider)
          }
          console.log('after', { wallet, provider })
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
  })

  useEffect(() => {
    console.log('onboard', onboard)
    console.log('onboard state', onboard.getState())
  }, [onboard])

  const startOnboard = async () => {
    const selected = await onboard.walletSelect()
    if (selected) await onboard.walletCheck()
    console.log({ onboard, provider })
  }

  return { onboard, provider, startOnboard }
}
