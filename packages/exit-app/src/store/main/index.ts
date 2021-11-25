import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { MainState } from './models'
import { fetchExitModuleData } from './actions'

const initialModulesState: MainState = {
  account: '0x9165265Aa286B6Aa4ed31bD0aD02e683689D5010',
  wallet: '',
  ens: '',
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
  },
  extraReducers: (builder) => {
    builder.addCase(fetchExitModuleData.fulfilled, (state, action) => {
      state.token = action.payload.token
      state.circulatingSupply = {
        address: action.payload.CSContract,
        value: action.payload.circulatingSupply,
      }
    })
  },
})

export const { setAccount, setENS, setWallet, resetWallet } = mainSlice.actions
