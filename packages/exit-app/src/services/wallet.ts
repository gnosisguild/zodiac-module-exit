import { _signer, setSigner } from '../hooks/useWallet'
import { BigNumber } from 'ethers'

function stripLeadingZeros(hex: string) {
  if (hex.startsWith('0x0') && hex.length > 3) {
    return '0x' + hex.substr(3)
  }
  return hex
}

export async function checkWalletNetwork(network: number) {
  const currentNetwork = await _signer.getChainId()

  if (currentNetwork === network) return true
  const ethereum = (window as any).ethereum
  if (!ethereum) return false

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: stripLeadingZeros(BigNumber.from(network).toHexString()) }],
    })
    setSigner(ethereum)
    const newNetwork = await _signer.getChainId()
    return newNetwork === network
  } catch (err) {
    console.warn('[changing network]', err.message)
  }
  return false
}
