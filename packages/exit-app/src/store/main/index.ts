import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { MainState, Network } from './models'
import { fetchExitModuleData, fetchTokenAssets, getGasEstimationsForAssets } from './actions'

const initialModulesState: MainState = {
  chainId: Network.RINKEBY,
  account: '',
  module: undefined,
  assets: {
    fiatTotal: '0',
    items: [],
  },
  claimAmount: '0',
  wallet: '',
  ens: '',
  selectedTokens: [],
}

export const mainSlice = createSlice({
  name: 'main',
  initialState: initialModulesState,
  reducers: {
    setAccount(state, action: PayloadAction<{ account: string; module?: string }>) {
      state.account = action.payload.account
      state.module = action.payload.module
    },
    setWallet(state, action: PayloadAction<string>) {
      state.wallet = action.payload
    },
    setENS(state, action: PayloadAction<string>) {
      state.ens = action.payload
    },
    resetWallet(state) {
      state.wallet = undefined
      state.ens = undefined
    },
    setClaimAmount(state, action: PayloadAction<string>) {
      state.claimAmount = action.payload
    },
    setSelectedTokens(state, action: PayloadAction<string[]>) {
      state.selectedTokens = action.payload
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchExitModuleData.fulfilled, (state, action) => {
      state.token = action.payload.token
      state.circulatingSupply = {
        address: action.payload.CSContract,
        value: action.payload.circulatingSupply,
      }
    })
    builder.addCase(fetchTokenAssets.fulfilled, (state, action) => {
      state.assets = action.payload
      state.selectedTokens = action.payload.items
        .map((item) => item.tokenInfo.address)
        .filter((address) => address !== state.token?.address)
    })
    builder.addCase(getGasEstimationsForAssets.fulfilled, (state, action) => {
      state.assets.items = action.payload
    })
  },
})

export const { setAccount, setENS, setWallet, resetWallet, setClaimAmount, setSelectedTokens } = mainSlice.actions
