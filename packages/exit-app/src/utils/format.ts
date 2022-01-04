import { BigNumber, BigNumberish } from 'ethers'

export const fiatFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
export const balanceFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 5,
})
export const integerFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function sortBigNumberArray(array: BigNumberish[]): BigNumber[] {
  return array
    .map((item) => BigNumber.from(item))
    .sort((a, b) => {
      if (a.eq(b)) return 0
      return a.lt(b) ? -1 : 1
    })
}
