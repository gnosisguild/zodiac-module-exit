import { BigNumber, BigNumberish, ethers } from 'ethers'
import { SafeAssets, Token, TokenType } from '../store/main/models'
import { fiatFormatter } from './format'

export function getClaimableAmount(
  token?: Token,
  assets?: SafeAssets,
  balance?: BigNumberish,
  circulatingSupply?: BigNumberish,
) {
  if (!assets || !token || !balance || !circulatingSupply) return
  if (token.type === TokenType.ERC721) {
    if (BigNumber.from(circulatingSupply).isZero()) return '0'
    // ERC-721
    return fiatFormatter.format(
      (parseFloat(assets.fiatTotal) * BigNumber.from(balance).toNumber()) /
        BigNumber.from(circulatingSupply).toNumber(),
    )
  }

  const tokenAsset = assets.items.find((asset) => asset.tokenInfo.address === token.address)
  if (!tokenAsset) return
  const _balance = ethers.utils.formatUnits(balance, token.decimals)
  return fiatFormatter.format(parseFloat(tokenAsset.fiatConversion) * parseFloat(_balance))
}

export function getClaimRate(amount: BigNumber, totalSupply: BigNumberish) {
  if (amount.gt(totalSupply)) return 1
  if (BigNumber.from(totalSupply).isZero()) return 0
  const fnAmount = ethers.FixedNumber.fromValue(amount, 18)
  const fnCS = ethers.FixedNumber.fromValue(BigNumber.from(totalSupply), 18)
  return fnAmount.divUnsafe(fnCS).toUnsafeFloat()
}
