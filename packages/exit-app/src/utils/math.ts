import { BigNumber, BigNumberish, ethers } from 'ethers'
import { SafeAssets, Token } from '../store/main/models'
import { fiatFormatter } from './format'

export function getClaimableAmount(token?: Token, assets?: SafeAssets, balance?: BigNumberish) {
  if (!assets || !token || !balance) return
  const tokenAsset = assets.items.find((asset) => asset.tokenInfo.address === token.address)
  if (!tokenAsset) return
  const _balance = ethers.utils.formatUnits(balance, token.decimals)
  return fiatFormatter.format(parseFloat(tokenAsset.fiatConversion) * parseFloat(_balance))
}

export function getClaimRate(amount: BigNumber, totalSupply: BigNumberish) {
  if (amount.gt(totalSupply)) return 1
  const fnAmount = ethers.FixedNumber.fromValue(amount, 18)
  const fnCS = ethers.FixedNumber.fromValue(BigNumber.from(totalSupply), 18)
  return fnAmount.divUnsafe(fnCS).toUnsafeFloat()
}
