import EIP3770Prefixes from './data/eip3770.json'

export function formatAddressEIP3770(chainId: number, address: string) {
  const prefix = getEIP3770Prefix(chainId)
  if (!prefix) return
  return `${prefix}:${address}`
}

export function getEIP3770Prefix(chainId: number): string | undefined {
  const index = chainId.toString()
  return (EIP3770Prefixes as Record<string, string>)[index]
}
