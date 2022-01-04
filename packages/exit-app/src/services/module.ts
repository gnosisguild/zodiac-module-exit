import { BigNumber, ethers } from 'ethers'
import { Erc20__factory, ZodiacModuleExit__factory } from '../contracts/types'
import { Call, Contract, Provider } from 'ethcall'
import { Token, TokenType } from '../store/main/models'
import { fetchContractSourceCode } from './contract'
import { getSafeModules } from './safe'

export async function getExitModule(provider: ethers.providers.BaseProvider, module: string) {
  const ethcallProvider = new Provider()
  await ethcallProvider.init(provider)

  const exit = new Contract(module, ZodiacModuleExit__factory.abi)
  const txs: Call[] = [exit.circulatingSupply(), exit.designatedToken(), exit.getCirculatingSupply()]
  const results = await ethcallProvider.tryAll(txs)

  return {
    circulatingSupplyAddress: results[0] as string,
    designatedToken: results[1] as string,
    circulatingSupply: results[2] as BigNumber,
  }
}

export async function getToken(provider: ethers.providers.BaseProvider, token: string): Promise<Token> {
  const ethcallProvider = new Provider()
  await ethcallProvider.init(provider)

  const cs = new Contract(token, Erc20__factory.abi)
  const txs: Call[] = [cs.symbol(), cs.decimals()]
  const results = await ethcallProvider.tryAll(txs)

  return {
    type: TokenType.ERC20,
    address: token,
    symbol: results[0] as string,
    decimals: results[1] as number,
  }
}

export async function getTokenBalance(provider: ethers.providers.BaseProvider, token: string, wallet: string) {
  const contract = Erc20__factory.connect(token, provider)
  return contract.balanceOf(wallet)
}

export async function isExitModule(provider: ethers.providers.BaseProvider, address: string): Promise<boolean> {
  const exitModule = ZodiacModuleExit__factory.connect(address, provider)

  try {
    // 0xaf20af8a == IExitBase interface ID
    return await exitModule.supportsInterface('0xaf20af8a')
  } catch (err) {
    console.warn('error determining exit module with ERP-165', err)
  }

  try {
    const { ContractName } = await fetchContractSourceCode(provider.network.chainId, address)
    return ContractName === 'Exit'
  } catch (err) {
    console.warn('error determining exit module using Etherscan', err)
  }

  return false
}

export async function getExitModulesFromSafe(
  provider: ethers.providers.BaseProvider,
  address: string,
): Promise<string | undefined> {
  let modules: string[] = []
  try {
    modules = await getSafeModules(provider, address)
  } catch (err) {}

  for (const module of modules) {
    if (await isExitModule(provider, module)) {
      return module
    }
  }
}
