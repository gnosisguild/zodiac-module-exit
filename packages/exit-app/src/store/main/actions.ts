import { BigNumber, BigNumberish, ethers } from 'ethers'
import { getExitModule, getToken } from '../../services/module'
import { createAsyncThunk } from '@reduxjs/toolkit'
import { SafeTransactionApi } from '../../services/safeTransactionApi'
import { SafeAssets, TokenAsset } from './models'
import { getGasEstimationForToken } from '../../services/erc20'
import { getAccount } from './selectors'
import { RootState } from '../index'
import { Erc721__factory } from '../../contracts/types/factories/Erc721__factory'
import { Contract, Provider } from 'ethcall'
import { _signer } from '../../hooks/useWallet'

export const fetchExitModuleData = createAsyncThunk(
  'main/fetchExitModuleData',
  async ({ provider, module }: { module: string; provider: ethers.providers.BaseProvider }) => {
    const response = await getExitModule(provider, module)
    const tokenResponse = await getToken(provider, response.designatedToken)

    return {
      type: response.type,
      CSContract: response.circulatingSupplyAddress,
      circulatingSupply: response.circulatingSupply.toString(),
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
  async ({ wallet, token }: { wallet: string; token: string }): Promise<string[]> => {
    const ERC721_contract = Erc721__factory.connect(token, _signer)
    const balance = await ERC721_contract.balanceOf(wallet)

    if (!balance.toNumber) return []

    const ERC721_multicall = new Contract(token, Erc721__factory.abi)
    const txs = []
    for (let i = 0; i < balance.toNumber(); i++) {
      txs.push(ERC721_multicall.tokenOfOwnerByIndex(wallet, i))
    }
    const ethcallProvider = new Provider()
    await ethcallProvider.init(_signer.provider)
    const results: BigNumberish[] = await ethcallProvider.tryAll(txs)

    return results.map((tokenId) => BigNumber.from(tokenId).toString())
  },
)
