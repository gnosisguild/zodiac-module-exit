import EIP3770List from './data/eip3770.json'
import { ethers } from 'ethers'

const EIP3770Names = Object.values(EIP3770List)
const EIP3770ChainIds = Object.keys(EIP3770List)

export function formatAddressEIP3770(chainId: number, address: string) {
  const prefix = getEIP3770Prefix(chainId)
  if (!prefix) return
  return `${prefix}:${address}`
}

export function getEIP3770Prefix(chainId: number): string | undefined {
  const index = chainId.toString()
  return (EIP3770List as Record<string, string>)[index]
}

export function getEIP3770ChainId(name: string): number | undefined {
  const index = EIP3770Names.indexOf(name)
  if (index >= 0) {
    return parseInt(EIP3770ChainIds[index])
  }
  return
}

export function getAddress(address: string): [string, number?] | undefined {
  if (address.includes(':')) {
    const [chainShortName, _address] = address.split(':', 2)
    const chainId = getEIP3770ChainId(chainShortName)
    if (chainId && ethers.utils.isAddress(_address)) {
      return [_address, chainId]
    }
  }
  if (ethers.utils.isAddress(address)) {
    return [address]
  }
}
