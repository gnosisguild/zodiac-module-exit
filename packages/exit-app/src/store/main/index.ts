import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { EXIT_STEP, MainState } from './models'
import { fetchExitModuleData, fetchTokenAssets, getAvailableTokens, getGasEstimationsForAssets } from './actions'
import { BigNumber, ethers } from 'ethers'
import { getNetworkName, NETWORK } from '../../utils/networks'

const ethereum = (window as any).ethereum
let initialChainId
try {
  const chainId: BigNumber | undefined = ethereum && ethereum.chainId && ethers.BigNumber.from(ethereum.chainId)
  if (chainId && getNetworkName(chainId.toNumber())) {
    initialChainId = chainId.toNumber()
  }
} catch (err) {}

const initialModulesState: MainState = {
  chainId: initialChainId || NETWORK.MAINNET,
  loading: false,
  account: '',
  module: undefined,
  assets: {
    fiatTotal: '0',
    items: [],
  },
  claimAmount: '0',
  claimToken: undefined,
  wallet: '',
  ens: '',
  selectedTokens: [],
  availableTokens: [],
  step: EXIT_STEP.EXIT,
}

export const mainSlice = createSlice({
  name: 'main',
  initialState: initialModulesState,
  reducers: {
    setAccount(state, action: PayloadAction<{ account: string; module?: string }>) {
      state.account = action.payload.account
      state.module = action.payload.module
      state.loading = false
    },
    setWallet(state, action: PayloadAction<string>) {
      state.wallet = action.payload
    },
    setChainId(state, action: PayloadAction<number>) {
      state.chainId = action.payload
    },
    setENS(state, action: PayloadAction<string>) {
      state.ens = action.payload
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },
    resetWallet(state) {
      state.wallet = undefined
      state.ens = undefined
    },
    setClaimAmount(state, action: PayloadAction<string>) {
      state.claimAmount = action.payload
      state.step = EXIT_STEP.EXIT
    },
    setClaimToken(state, action: PayloadAction<string>) {
      state.claimToken = action.payload
      state.claimAmount = '1'
      state.step = EXIT_STEP.EXIT
    },
    setSelectedTokens(state, action: PayloadAction<string[]>) {
      state.selectedTokens = action.payload
    },
    setBalance(state, action: PayloadAction<string>) {
      state.balance = action.payload
    },
    setExitStep(state, action: PayloadAction<EXIT_STEP>) {
      state.step = action.payload
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchExitModuleData.fulfilled, (state, action) => {
      state.type = action.payload.type
      state.token = action.payload.token
      state.circulatingSupply = {
        address: action.payload.CSContract,
        value: action.payload.circulatingSupply,
      }
      state.selectedTokens = state.selectedTokens.filter((token) => token !== action.payload.token.address)
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
    builder.addCase(getAvailableTokens.fulfilled, (state, action) => {
      state.availableTokens = action.payload
      state.claimToken = action.payload[0]?.tokenId
      state.claimAmount = '1'
    })
  },
})

export const {
  setAccount,
  setChainId,
  setENS,
  setWallet,
  setLoading,
  resetWallet,
  setClaimAmount,
  setClaimToken,
  setSelectedTokens,
  setBalance,
  setExitStep,
} = mainSlice.actions
