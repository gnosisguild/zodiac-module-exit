import { Call, Contract, Provider } from 'ethcall'
import { ethers } from 'ethers'
import { ModuleType, Token, TokenType } from '../store/main/models'
import { fetchContractSourceCode } from './contract'
import { getSafeModules } from './safe'
import { Erc20__factory, Erc721__factory, ExitErc20__factory, ExitErc721__factory } from '../contracts/types'
import { CACHE_TYPE, getCacheHash, readCache, writeCache } from './cache'

export async function getExitModule(provider: ethers.providers.BaseProvider, module: string) {
  try {
    return getExitERC721Module(provider, module)
  } catch (err) {
    return getExitERC721Module(provider, module)
  }
}

export async function getExitERC20Module(provider: ethers.providers.BaseProvider, module: string) {
  const ethcallProvider = new Provider()
  await ethcallProvider.init(provider)

  const exit = new Contract(module, ExitErc20__factory.abi)
  const txs: Call[] = [exit.circulatingSupply(), exit.designatedToken(), exit.getCirculatingSupply()]
  const results = await ethcallProvider.tryAll(txs)

  return {
    type: ModuleType.ERC20,
    circulatingSupplyAddress: results[0] as string,
    designatedToken: results[1] as string,
    circulatingSupply: results[2] as ethers.BigNumber,
  }
}

export async function getExitERC721Module(provider: ethers.providers.BaseProvider, module: string) {
  const ethcallProvider = new Provider()
  await ethcallProvider.init(provider)

  const exit = new Contract(module, ExitErc721__factory.abi)
  const txs: Call[] = [exit.circulatingSupply(), exit.collection(), exit.getCirculatingSupply()]
  const results = await ethcallProvider.tryAll(txs)

  return {
    type: ModuleType.ERC721,
    circulatingSupplyAddress: results[0] as string,
    designatedToken: results[1] as string,
    circulatingSupply: results[2] as ethers.BigNumber,
  }
}

export function getToken(provider: ethers.providers.BaseProvider, type: ModuleType, token: string): Promise<Token> {
  if (type === ModuleType.ERC721) return getERC721Token(provider, token)
  return getERC20Token(provider, token)
}

export async function getERC20Token(provider: ethers.providers.BaseProvider, address: string): Promise<Token> {
  const cacheHash = getCacheHash(CACHE_TYPE.ERC20, address)

  const cache = await readCache(cacheHash)
  if (cache !== undefined) return cache as Token

  const ethcallProvider = new Provider()
  await ethcallProvider.init(provider)

  const cs = new Contract(address, Erc20__factory.abi)
  const txs: Call[] = [cs.symbol(), cs.decimals()]
  const results = await ethcallProvider.tryAll(txs)

  const token = {
    type: TokenType.ERC20,
    address,
    symbol: results[0] as string,
    decimals: results[1] as number,
  }
  writeCache(cacheHash, token)
  return token
}

export async function getERC721Token(provider: ethers.providers.BaseProvider, address: string): Promise<Token> {
  const cacheHash = getCacheHash(CACHE_TYPE.ERC721, address)

  const cache = await readCache(cacheHash)
  if (cache !== undefined) return cache as Token

  const contractERC721 = Erc721__factory.connect(address, provider)

  const token = {
    type: TokenType.ERC721,
    address,
    symbol: await contractERC721.symbol(),
    decimals: 1,
  }
  writeCache(cacheHash, token)
  return token
}

export async function getTokenBalance(provider: ethers.providers.BaseProvider, token: string, wallet: string) {
  const contract = Erc20__factory.connect(token, provider)
  return (await contract.balanceOf(wallet)).toString()
}

export async function isExitModule(provider: ethers.providers.BaseProvider, address: string): Promise<boolean> {
  const cacheHash = getCacheHash(CACHE_TYPE.IS_EXIT_MODULE, address)
  const cache = await readCache(cacheHash)
  if (cache !== undefined) return cache as boolean

  const exitModule = ExitErc20__factory.connect(address, provider)
  try {
    // 0xaf20af8a == IExitBase interface ID
    const response = await exitModule.supportsInterface('0xaf20af8a')
    writeCache(cacheHash, response)
    return response
  } catch (err) {
    console.warn('error determining exit module using EIP-165', err)
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
  const modules = await getSafeModules(provider, address)
  for (const module of modules) {
    if (await isExitModule(provider, module)) {
      return module
    }
  }
}
