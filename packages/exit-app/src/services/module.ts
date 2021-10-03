import { ethers } from 'ethers'
import { ZodiacModuleExit__factory } from '../contracts/types'
import { Contract, Provider } from 'ethcall'

export async function filterExitModule(
  provider: ethers.providers.BaseProvider,
  modules: string[],
  filter?: boolean,
): Promise<string | undefined> {
  const ethcallProvider = new Provider()
  await ethcallProvider.init(provider)

  if (filter) {
    // Ethers fails decoding the result data from the MultiCall contract if a wallet address is call
    // So, they're filtered
    const modulesBytecodes = await Promise.all(modules.map((module) => provider.getCode(module)))
    modules = modules.filter((_, index) => modulesBytecodes[index] !== '0x')
  }

  const txs = modules.map((module) => {
    const exit = new Contract(module, ZodiacModuleExit__factory.abi)
    return exit.circulatingSupply()
  })

  try {
    const results = await ethcallProvider.tryAll(txs)
    const firstExitModuleIndex = results.findIndex((result) => result !== null)

    if (firstExitModuleIndex < 0) return
    return modules[firstExitModuleIndex]
  } catch (err) {
    if (!filter) {
      return filterExitModule(provider, modules, true)
    }
    throw err
  }
}

export async function getExitData(provider: ethers.providers.BaseProvider, module: string) {
  const exit = ZodiacModuleExit__factory.connect(module, provider)

  exit.getCirculatingSupply()
  exit.designatedToken()
}
