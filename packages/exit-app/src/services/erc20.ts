import { ethers } from 'ethers'
import { Erc20__factory } from '../contracts/types'
import { AddressOne } from './safe'

export function getGasEstimationForToken(provider: ethers.providers.BaseProvider, address: string) {
  const tokenContract = Erc20__factory.connect(address, provider)
  return tokenContract.estimateGas.transfer(AddressOne, '1')
}
