import { ethers } from 'ethers'
import { GnosisSafe__factory } from '../contracts/types'

export const AddressOne = '0x0000000000000000000000000000000000000001'

export async function getSafeModules(
  provider: ethers.providers.Provider,
  address: string,
  next?: string,
): Promise<string[]> {
  const safe = GnosisSafe__factory.connect(address, provider)
  const start = next || AddressOne
  const { array } = await safe.getModulesPaginated(start, 100)
  return array
}
