import { BigNumber, ethers } from 'ethers'
import { getExitModule, getToken } from '../../services/module'
import { createAsyncThunk } from '@reduxjs/toolkit'
import { SafeTransactionApi } from '../../services/safeTransactionApi'
import { SafeAssets, TokenAsset } from './models'
import { getGasEstimationForToken } from '../../services/erc20'
import { getAccount } from './selectors'
import { RootState } from '../index'

export const fetchExitModuleData = createAsyncThunk(
  'main/fetchExitModuleData',
  async ({ provider, module }: { module: string; provider: ethers.providers.BaseProvider }) => {
    try {
      const response = await getExitModule(provider, module)
      const tokenResponse = await getToken(provider, response.designatedToken)

      return {
        CSContract: response.circulatingSupplyAddress,
        circulatingSupply: response.circulatingSupply.toString(),
        token: tokenResponse,
      }
    } catch (err) {
      console.log('err', err)
      throw err
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
