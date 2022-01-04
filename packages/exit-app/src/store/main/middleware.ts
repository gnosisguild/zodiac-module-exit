import { Middleware } from 'redux'
import { fetchTokenAssets, getGasEstimationsForAssets } from './actions'
import { SafeAssets } from './models'

export const mainMiddleware: Middleware<any, any, any> = (store) => (next) => (action: any) => {
  if (action.type === fetchTokenAssets.fulfilled.type) {
    const { provider } = action.meta.arg
    const safeAssets: SafeAssets = action.payload
    store.dispatch(getGasEstimationsForAssets({ provider, tokens: safeAssets.items }))
  }
  return next(action)
}
