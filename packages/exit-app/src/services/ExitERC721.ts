import { ExitErc721__factory } from '../contracts/types'
import { Erc721__factory } from '../contracts/types/factories/Erc721__factory'
import { _signer } from '../hooks/useWallet'
import { Token } from '../store/main/models'
import { sortBigNumberArray } from '../utils/format'
import { IExit } from './interface/IExit'

interface UseExitERC721Params {
  module: string
  wallet: string
  token: Token
  claimToken: string
  selectedTokens: string[]
}

export class ExitERC721 implements IExit {
  private readonly module: string
  private readonly wallet: string
  private token: Token
  private readonly claimToken: string
  private selectedTokens: string[]

  constructor({ claimToken, token, selectedTokens, module, wallet }: UseExitERC721Params) {
    this.module = module
    this.wallet = wallet
    this.token = token
    this.claimToken = claimToken
    this.selectedTokens = selectedTokens
  }

  async needsApproval() {
    const ERC721 = Erc721__factory.connect(this.token.address, _signer)
    return !(await ERC721.isApprovedForAll(this.wallet, this.module))
  }

  approve() {
    const ERC721 = Erc721__factory.connect(this.token.address, _signer)
    return ERC721.populateTransaction.setApprovalForAll(this.module, true)
  }

  exit() {
    const exitModule = ExitErc721__factory.connect(this.module, _signer)
    return exitModule.populateTransaction.exit(this.claimToken, this.getClaimToken())
  }

  private getClaimToken() {
    return sortBigNumberArray(this.selectedTokens)
      .filter((token) => !token.isZero())
      .map((token) => token.toHexString())
  }
}
