import { RootState } from '../index'
import { createSelector } from '@reduxjs/toolkit'

const getMainState = (state: RootState) => state.main

export const getAccount = createSelector(getMainState, (main) => main.account)
export const getWalletAddress = createSelector(getMainState, (main) => main.wallet)
export const getENS = createSelector(getMainState, (main) => main.ens)
export const getToken = createSelector(getMainState, (main) => main.token)
export const getCirculatingSupply = createSelector(getMainState, (main) => main.circulatingSupply)
