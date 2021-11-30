import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { MainState, Network } from './models'
import { fetchExitModuleData, fetchTokenAssets } from './actions'

const initialModulesState: MainState = {
  chainId: Network.RINKEBY,
  account: '0xD63F6393f2ADf6238a557f3c9Cb620D12516E029',
  module: '0x9165265Aa286B6Aa4ed31bD0aD02e683689D5010',
  claimAmount: '0',
  wallet: '',
  ens: '',
  selectedTokens: [],
}

export const mainSlice = createSlice({
  name: 'main',
  initialState: initialModulesState,
  reducers: {
    setAccount(state, action: PayloadAction<string>) {
      state.account = action.payload
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
    })
  },
})

export const { setAccount, setENS, setWallet, resetWallet, setClaimAmount, setSelectedTokens } = mainSlice.actions
