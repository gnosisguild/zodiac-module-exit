import { RootState } from '../index'
import { createSelector } from '@reduxjs/toolkit'

const getMainState = (state: RootState) => state.main

export const getChainId = createSelector(getMainState, (main) => main.chainId)
export const getAccount = createSelector(getMainState, (main) => main.account)
export const getModule = createSelector(getMainState, (main) => main.module)
export const getWalletAddress = createSelector(getMainState, (main) => main.wallet)
export const getENS = createSelector(getMainState, (main) => main.ens)
export const getDesignatedToken = createSelector(getMainState, (main) => main.token)
export const getCirculatingSupply = createSelector(getMainState, (main) => main.circulatingSupply)
export const getClaimAmount = createSelector(getMainState, (main) => main.claimAmount)
export const getAssets = createSelector(getMainState, (main) => main.assets)
export const getSelectedTokens = createSelector(getMainState, (main) => main.selectedTokens)
export const getLoading = createSelector(getMainState, (main) => main.loading)
export const getModuleType = createSelector(getMainState, (main) => main.type)
export const getClaimToken = createSelector(getMainState, (main) => main.claimToken)
export const getTokens = createSelector(getMainState, (main) => main.availableTokens)
export const getBalance = createSelector(getMainState, (main) => main.balance)
