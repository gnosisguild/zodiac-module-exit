import { BigNumber, ethers } from 'ethers'
import { Erc20__factory, ExitErc20__factory } from '../contracts/types'
import { _signer } from '../hooks/useWallet'
import { Token } from '../store/main/models'
import { sortBigNumberArray } from '../utils/format'
import { IExit } from './interface/IExit'

const MAX_UINT256_AMOUNT = BigNumber.from(2).pow(256).sub(1)

interface UseExitERC20Params {
  module: string
  wallet: string
  token: Token
  claimAmount: string
  selectedTokens: string[]
}

export class ExitERC20 implements IExit {
  private readonly module: string
  private readonly wallet: string
  private token: Token
  private readonly claimAmount: string
  private selectedTokens: string[]

  constructor({ claimAmount, token, selectedTokens, module, wallet }: UseExitERC20Params) {
    this.module = module
    this.wallet = wallet
    this.token = token
    this.claimAmount = claimAmount
    this.selectedTokens = selectedTokens
  }

  async needsApproval() {
    const ERC20 = Erc20__factory.connect(this.token.address, _signer)
    const allowance = await ERC20.allowance(this.wallet, this.module)
    return allowance.lt(this.getWeiAmount())
  }

  approve() {
    const ERC20 = Erc20__factory.connect(this.token.address, _signer)
    return ERC20.populateTransaction.approve(this.module, MAX_UINT256_AMOUNT)
  }

  exit() {
    const exitModule = ExitErc20__factory.connect(this.module, _signer)
    return exitModule.populateTransaction.exit(this.getWeiAmount(), this.getClaimToken())
  }

  private getWeiAmount() {
    return ethers.utils.parseUnits(this.claimAmount, this.token.decimals)
  }

  private getClaimToken() {
    return sortBigNumberArray(this.selectedTokens)
      .filter((token) => !token.isZero())
      .map((token) => token.toHexString())
  }
}
