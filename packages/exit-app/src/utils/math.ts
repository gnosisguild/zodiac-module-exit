import { BigNumberish, ethers } from 'ethers'
import { SafeAssets, Token } from '../store/main/models'
import { fiatFormatter } from './format'

export function getClaimableAmount(token?: Token, assets?: SafeAssets, balance?: BigNumberish) {
  if (!assets || !token || !balance) return '0'
  const tokenAsset = assets.items.find((asset) => asset.tokenInfo.address === token.address)
  if (!tokenAsset) return '0'
  const _balance = ethers.utils.formatUnits(balance, token.decimals)
  return fiatFormatter.format(parseFloat(tokenAsset.fiatConversion) * parseFloat(_balance))
}
