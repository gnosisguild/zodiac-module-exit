import { ethers } from 'ethers'

export function getProvider(chainId: number) {
  return new ethers.providers.InfuraProvider(chainId, process.env.REACT_APP_INFURA_KEY)
}
