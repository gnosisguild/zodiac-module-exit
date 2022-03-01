import { useRootSelector } from '../store'
import { getCirculatingSupply, getClaimAmount, getDesignatedToken } from '../store/main/selectors'
import { useMemo } from 'react'
import { BigNumber, BigNumberish, ethers } from 'ethers'
import { TokenType } from '../store/main/models'

export function useAmountRate() {
  const token = useRootSelector(getDesignatedToken)
  const _claimAmount = useRootSelector(getClaimAmount)
  const circulatingSupply = useRootSelector(getCirculatingSupply)

  return useMemo<(amount: BigNumberish) => BigNumber>(() => {
    const totalSupply = circulatingSupply?.value
    if (!token || !totalSupply || BigNumber.from(totalSupply).isZero()) return () => BigNumber.from(0)
    const claimAmount =
      token.type === TokenType.ERC721
        ? BigNumber.from(_claimAmount)
        : ethers.utils.parseUnits(_claimAmount, token.decimals)
    return (amount: BigNumberish) => {
      if (BigNumber.from(claimAmount).gt(totalSupply)) return BigNumber.from(amount)
      if (BigNumber.from(totalSupply).isZero()) return BigNumber.from(0)
      return BigNumber.from(amount).mul(claimAmount).div(totalSupply)
    }
  }, [_claimAmount, circulatingSupply?.value, token])
}
