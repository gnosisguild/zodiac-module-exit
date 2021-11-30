import { ethers } from 'ethers'
import { getExitModule, getToken } from '../../services/module'
import { createAsyncThunk } from '@reduxjs/toolkit'
import { SafeTransactionApi } from '../../services/safeTransactionApi'
import { SafeAssets } from './models'

export const fetchExitModuleData = createAsyncThunk(
  'main/fetchExitModuleData',
  async ({ provider, module }: { module: string; provider: ethers.providers.BaseProvider }) => {
    const response = await getExitModule(provider, module)
    const tokenResponse = await getToken(provider, response.designatedToken)

    return {
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
