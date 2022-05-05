import { BigNumber, ethers } from 'ethers'
import { getExitModule, getToken } from '../../services/module'
import { createAsyncThunk } from '@reduxjs/toolkit'
import { SafeTransactionApi } from '../../services/safeTransactionApi'
import { AvailableToken, SafeAssets, TokenAsset } from './models'
import { getGasEstimationForToken } from '../../services/erc20'
import { getAccount } from './selectors'
import { RootState } from '../index'
import { Erc721__factory } from '../../contracts/types/factories/Erc721__factory'
import { getTokenImage } from '../../services/erc721'
import { getNetworkRPC, NETWORK } from '../../utils/networks'
import { ContractCallContext, ContractCallResults, Multicall } from 'ethereum-multicall'

export const fetchExitModuleData = createAsyncThunk(
  'main/fetchExitModuleData',
  async ({ provider, module }: { module: string; provider: ethers.providers.BaseProvider }) => {
    const exitModule = await getExitModule(provider, module)
    const tokenResponse = await getToken(provider, exitModule.type, exitModule.designatedToken)

    return {
      type: exitModule.type,
      CSContract: exitModule.circulatingSupplyAddress,
      circulatingSupply: exitModule.circulatingSupply.toString(),
      token: tokenResponse,
    }
  },
)

export const fetchTokenAssets = createAsyncThunk(
  'main/fetchTokenAssets',
  async ({ provider, safe }: { safe: string; provider: ethers.providers.BaseProvider }): Promise<SafeAssets> => {
    const { chainId } = await provider.getNetwork()
    return SafeTransactionApi.create(chainId, safe).getAssets()
  },
)

export const getGasEstimationsForAssets = createAsyncThunk(
  'main/getGasEstimationsForAssets',
  async (
    {
      provider,
      tokens,
    }: {
      tokens: TokenAsset[]
      provider: ethers.providers.BaseProvider
    },
    store,
  ): Promise<TokenAsset[]> => {
    const gasPrice = await provider.getGasPrice()
    const state = store.getState() as RootState
    const requests = tokens.map(async (token) => {
      const address = token.tokenInfo.address
      let gas = BigNumber.from(token.gas)
      if (BigNumber.from(address).isZero()) {
        // return 21,000 if calculating gas for ETH transfer
        gas = BigNumber.from(21000)
      } else {
        try {
          gas = await getGasEstimationForToken(provider, address, getAccount(state))
        } catch (err) {
          console.warn('unable to estimate gas for', address, err)
        }
      }
      return {
        ...token,
        gas: gas.mul(gasPrice).toString(),
      }
    })
    return Promise.all(requests)
  },
)

export const getAvailableTokens = createAsyncThunk(
  'main/getAvailableTokens',
  async ({
    wallet,
    token,
    network,
  }: {
    wallet: string
    token: string
    network: NETWORK
  }): Promise<AvailableToken[]> => {
    const rpcUrl = getNetworkRPC(network)
    const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl, network)

    const ERC721_contract = Erc721__factory.connect(token, provider as any)
    const balance = await ERC721_contract.balanceOf(wallet)

    if (BigNumber.from(balance).isZero()) return []

    const multicall = new Multicall({ ethersProvider: provider as any, tryAggregate: true })
    const tokensCallContext: ContractCallContext = {
      contractAddress: token,
      reference: 'Erc721',
      abi: Erc721__factory.abi,
      calls: [],
    }

    for (let i = 0; i < balance.toNumber(); i++) {
      tokensCallContext.calls.push({
        methodName: 'tokenOfOwnerByIndex',
        methodParameters: [wallet, i],
        reference: i.toString(),
      })
    }

    const tokenCallResults: ContractCallResults = await multicall.call(tokensCallContext)
    const tokenResults: BigNumber[] = tokenCallResults.results.Erc721.callsReturnContext.map((returnContext) =>
      BigNumber.from(returnContext.returnValues[0]),
    )

    const uriCallContext: ContractCallContext = {
      contractAddress: token,
      reference: 'Erc721',
      abi: Erc721__factory.abi,
      calls: tokenResults.map((tokenId) => ({
        methodName: 'tokenURI',
        methodParameters: [tokenId],
        reference: tokenId.toString(),
      })),
    }

    const uriCallResults: ContractCallResults = await multicall.call(uriCallContext)
    const tokenURIs: string[] = uriCallResults.results.Erc721.callsReturnContext.map(
      (returnContext) => returnContext.returnValues[0],
    )
    const imgUrls = await Promise.all(tokenURIs.map(getTokenImage))

    return tokenResults.map((tokenId, index) => ({
      tokenId: tokenId.toString(),
      tokenUri: tokenURIs[index],
      imgUrl: imgUrls[index],
    }))
  },
)
