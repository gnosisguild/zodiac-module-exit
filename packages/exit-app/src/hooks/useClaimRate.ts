import { useRootSelector } from '../store'
import { getCirculatingSupply, getClaimAmount, getDesignatedToken } from '../store/main/selectors'
import { useMemo } from 'react'
import { getClaimRate } from '../utils/math'
import { ethers } from 'ethers'

export function useClaimRate() {
  const token = useRootSelector(getDesignatedToken)
  const claimAmount = useRootSelector(getClaimAmount)
  const circulatingSupply = useRootSelector(getCirculatingSupply)

  return useMemo<number>(() => {
    const totalSupply = circulatingSupply?.value
    if (!token || !totalSupply) return 0
    const amount = ethers.utils.parseUnits(claimAmount, token.decimals)
    return getClaimRate(amount, totalSupply)
  }, [circulatingSupply?.value, claimAmount, token])
}
