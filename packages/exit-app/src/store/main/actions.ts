import { ethers } from 'ethers'
import { getExitModule, getToken } from '../../services/module'
import { createAsyncThunk } from '@reduxjs/toolkit'

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
