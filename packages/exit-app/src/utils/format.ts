import { BigNumber, BigNumberish } from 'ethers'

export const fiatFormatter = new Intl.NumberFormat(undefined, {
  minimumSignificantDigits: 2,
  maximumSignificantDigits: 2,
})
export const balanceFormatter = new Intl.NumberFormat(undefined, {
  minimumSignificantDigits: 2,
  maximumSignificantDigits: 6,
})

export function sortBigNumberArray(array: BigNumberish[]): BigNumber[] {
  return array
    .map((item) => BigNumber.from(item))
    .sort((a, b) => {
      if (a.eq(b)) return 0
      return a.lt(b) ? -1 : 1
    })
}
