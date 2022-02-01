import { Middleware } from 'redux'
import { fetchTokenAssets, getAvailableTokens, getGasEstimationsForAssets } from './actions'
import { ModuleType, SafeAssets } from './models'
import { setWallet } from './index'
import { getDesignatedToken, getModuleType } from './selectors'

export const mainMiddleware: Middleware<any, any, any> = (store) => (next) => (action: any) => {
  if (action.type === fetchTokenAssets.fulfilled.type) {
    const { provider } = action.meta.arg
    const safeAssets: SafeAssets = action.payload
    store.dispatch(getGasEstimationsForAssets({ provider, tokens: safeAssets.items }))
  } else if (action.type === setWallet.type) {
    const state = store.getState()
    const type = getModuleType(state)
    const token = getDesignatedToken(state)
    const wallet = action.payload as string | undefined
    if (type === ModuleType.ERC721 && wallet && token) {
      store.dispatch(getAvailableTokens({ token: token.address, wallet }))
    }
  }

  return next(action)
}
