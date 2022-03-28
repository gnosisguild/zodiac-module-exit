import { formatAddressEIP3770 } from './address'

export function getSafeAppsLink(chainId: number, safeAddress: string) {
  const address = formatAddressEIP3770(chainId, safeAddress)
  return `https://gnosis-safe.io/app/${address}/apps`
}
