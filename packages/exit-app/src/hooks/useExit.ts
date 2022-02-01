import { useRootSelector } from '../store'
import {
  getClaimAmount,
  getClaimToken,
  getDesignatedToken,
  getModule,
  getModuleType,
  getSelectedTokens,
  getWalletAddress,
} from '../store/main/selectors'
import { ExitERC20 } from '../services/ExitERC20'
import { ModuleType } from '../store/main/models'
import { ExitERC721 } from '../services/ExitERC721'
import { IExit } from '../services/interface/IExit'

export const useExit = (): undefined | IExit => {
  const type = useRootSelector(getModuleType)
  const module = useRootSelector(getModule)
  const wallet = useRootSelector(getWalletAddress)
  const token = useRootSelector(getDesignatedToken)
  const claimAmount = useRootSelector(getClaimAmount)
  const claimToken = useRootSelector(getClaimToken)
  const selectedTokens = useRootSelector(getSelectedTokens)

  if (!module || !wallet || !token) return

  if (type === ModuleType.ERC721) {
    if (!claimToken) return
    return new ExitERC721({ module, wallet, token, claimToken, selectedTokens })
  }

  return new ExitERC20({ module, wallet, token, claimAmount, selectedTokens })
}
