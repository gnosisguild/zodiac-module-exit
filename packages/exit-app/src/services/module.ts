import { BigNumber, ethers } from 'ethers'
import { Multicall, ContractCallResults, ContractCallContext } from 'ethereum-multicall'
import { ModuleType, Token, TokenType } from '../store/main/models'
import { fetchContractSourceCode } from './contract'
import { getSafeModules } from './safe'
import { Erc20__factory, Erc721__factory, ExitErc20__factory, ExitErc721__factory } from '../contracts/types'
import { CACHE_TYPE, getCacheHash, readCache, writeCache } from './cache'

export async function getExitModule(provider: ethers.providers.BaseProvider, module: string) {
  const multicall = new Multicall({ ethersProvider: provider as any, tryAggregate: true })

  const callContext: ContractCallContext[] = [
    {
      contractAddress: module,
      reference: 'ExitErc20',
      abi: ExitErc20__factory.abi,
      calls: [
        {
          reference: 'circulatingSupply',
          methodName: 'circulatingSupply',
          methodParameters: [],
        },
        {
          reference: 'designatedToken',
          methodName: 'designatedToken',
          methodParameters: [],
        },
        {
          reference: 'getCirculatingSupply',
          methodName: 'getCirculatingSupply',
          methodParameters: [],
        },
      ],
    },
    {
      contractAddress: module,
      reference: 'ExitErc721',
      abi: ExitErc721__factory.abi,
      calls: [
        {
          reference: 'collection',
          methodName: 'collection',
          methodParameters: [],
        },
      ],
    },
  ]

  const callResults: ContractCallResults = await multicall.call(callContext)
  const results = {
    circulatingSupply: callResults.results.ExitErc20.callsReturnContext[0].returnValues[0] as string,
    getCirculatingSupply: BigNumber.from(callResults.results.ExitErc20.callsReturnContext[2].returnValues[0] || 0),
    designatedToken: callResults.results.ExitErc20.callsReturnContext[1].returnValues[0] as string | undefined,
    collection: callResults.results.ExitErc721.callsReturnContext[0].returnValues[0] as string | undefined,
  }

  if (results.collection) {
    return {
      type: ModuleType.ERC721,
      designatedToken: results.collection,
      circulatingSupplyAddress: results.circulatingSupply,
      circulatingSupply: results.getCirculatingSupply,
    }
  }

  return {
    type: ModuleType.ERC20,
    designatedToken: results.designatedToken as string,
    circulatingSupplyAddress: results.circulatingSupply,
    circulatingSupply: results.getCirculatingSupply,
  }
}

export function getToken(provider: ethers.providers.BaseProvider, type: ModuleType, token: string): Promise<Token> {
  if (type === ModuleType.ERC721) return getERC721Token(provider, token)
  return getERC20Token(provider, token)
}

export async function getERC20Token(provider: ethers.providers.BaseProvider, address: string): Promise<Token> {
  const cacheHash = getCacheHash(CACHE_TYPE.ERC20, address)

  const cache = await readCache(cacheHash)
  if (cache !== null) return cache as Token

  const multicall = new Multicall({ ethersProvider: provider as any, tryAggregate: true })
  const callContext: ContractCallContext[] = [
    {
      contractAddress: address,
      reference: 'ERC20',
      abi: Erc20__factory.abi,
      calls: [
        {
          reference: 'symbol',
          methodName: 'symbol',
          methodParameters: [],
        },
        {
          reference: 'decimals',
          methodName: 'decimals',
          methodParameters: [],
        },
      ],
    },
  ]
  const callResults: ContractCallResults = await multicall.call(callContext)
  const results = {
    symbol: callResults.results.ERC20.callsReturnContext[0].returnValues[0] as string,
    decimals: callResults.results.ERC20.callsReturnContext[1].returnValues[0] as number,
  }

  const token = {
    type: TokenType.ERC20,
    address,
    symbol: results.symbol,
    decimals: results.decimals,
  }
  writeCache(cacheHash, token)
  return token
}

export async function getERC721Token(provider: ethers.providers.BaseProvider, address: string): Promise<Token> {
  const cacheHash = getCacheHash(CACHE_TYPE.ERC721, address)

  const cache = await readCache(cacheHash)
  if (cache !== null) return cache as Token

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
  if (cache !== null) return cache as boolean

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
    const response = ContractName === 'Exit'
    writeCache(cacheHash, response)
    return response
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
