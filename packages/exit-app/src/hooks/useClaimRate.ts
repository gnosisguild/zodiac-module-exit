import { useRootSelector } from '../store'
import { getCirculatingSupply, getClaimAmount, getDesignatedToken, getModuleType } from '../store/main/selectors'
import { useMemo } from 'react'
import { getClaimRate } from '../utils/math'
import { BigNumber, ethers } from 'ethers'
import { ModuleType } from '../store/main/models'

export function useClaimRate() {
  const token = useRootSelector(getDesignatedToken)
  const type = useRootSelector(getModuleType)
  const claimAmount = useRootSelector(getClaimAmount)
  const circulatingSupply = useRootSelector(getCirculatingSupply)

  return useMemo<number>(() => {
    const totalSupply = circulatingSupply?.value
    if (!token || !totalSupply || BigNumber.from(totalSupply).isZero()) return 0
    const amount = ethers.utils.parseUnits(claimAmount, token.decimals)
    if (type === ModuleType.ERC721) return parseInt(claimAmount) / parseInt(totalSupply)
    return getClaimRate(amount, totalSupply)
  }, [circulatingSupply?.value, claimAmount, token, type])
}
