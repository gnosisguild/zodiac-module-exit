import { useEffect, useState } from 'react'
import Onboard from 'bnc-onboard'
import { ethers } from 'ethers'

const ONBOARD_JS_DAPP_ID = process.env.REACT_APP_ONBOARD_JS_DAPP_ID

let provider: ethers.providers.Web3Provider

export const useWallet = () => {
  // const { safe } = useSafeAppsSDK()

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
