import { WalletInitOptions } from 'bnc-onboard/dist/src/interfaces'
import { _signer, setProvider } from '../hooks/useWallet'
import { BigNumber } from 'ethers'

const PORTIS_ID = process.env.REACT_APP_PORTIS_ID ?? '852b763d-f28b-4463-80cb-846d7ec5806b'
const FORTMATIC_KEY = process.env.REACT_APP_FORTMATIC_KEY ?? 'pk_test_CAD437AA29BE0A40'

export enum WALLETS {
  METAMASK = 'metamask',
  WALLET_CONNECT = 'walletConnect',
  TREZOR = 'trezor',
  LEDGER = 'ledger',
  TRUST = 'trust',
  FORTMATIC = 'fortmatic',
  PORTIS = 'portis',
  AUTHEREUM = 'authereum',
  TORUS = 'torus',
  COINBASE = 'coinbase',
  WALLET_LINK = 'walletLink',
  OPERA = 'opera',
  OPERA_TOUCH = 'operaTouch',
  LATTICE = 'lattice',
}

type Wallet = WalletInitOptions & {
  desktop: boolean
  walletName: WALLETS
}

export function getWallets(networkId: number, rpcUrl: string): Wallet[] {
  return [
    { walletName: WALLETS.METAMASK, preferred: true, desktop: false },
    {
      walletName: WALLETS.WALLET_CONNECT,
      preferred: true,
      // as stated in the documentation, `infuraKey` is not mandatory if rpc is provided
      rpc: { [networkId]: rpcUrl },
      desktop: true,
      bridge: 'https://safe-walletconnect.gnosis.io/',
    },
    {
      walletName: WALLETS.TREZOR,
      appUrl: 'gnosis-safe.io',
      preferred: true,
      email: 'safe@gnosis.io',
      desktop: true,
      rpcUrl,
    },
    {
      walletName: WALLETS.LEDGER,
      desktop: true,
      preferred: true,
      rpcUrl,
      LedgerTransport: (window as any).TransportNodeHid,
    },
    { walletName: WALLETS.TRUST, preferred: true, desktop: false },
    {
      walletName: WALLETS.LATTICE,
      rpcUrl,
      appName: 'Gnosis Safe',
      desktop: false,
    },
    {
      walletName: WALLETS.FORTMATIC,
      apiKey: FORTMATIC_KEY,
      desktop: true,
    },
    {
      walletName: WALLETS.PORTIS,
      apiKey: PORTIS_ID,
      desktop: true,
    },
    { walletName: WALLETS.AUTHEREUM, desktop: false },
    { walletName: WALLETS.TORUS, desktop: true },
    { walletName: WALLETS.COINBASE, desktop: false },
    { walletName: WALLETS.WALLET_LINK, rpcUrl, desktop: false },
    { walletName: WALLETS.OPERA, desktop: false },
    { walletName: WALLETS.OPERA_TOUCH, desktop: false },
  ]
}

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
    setProvider(ethereum)
    const newNetwork = await _signer.getChainId()
    return newNetwork === network
  } catch (err) {
    console.warn('[changing network]', err.message)
  }
  return false
}
