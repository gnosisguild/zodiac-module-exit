import { useRootSelector } from '../../../store'
import { getModuleType } from '../../../store/main/selectors'
import { ModuleType } from '../../../store/main/models'
import { ClaimAmountInput } from './ClaimAmountInput'
import { ClaimTokenSelect } from './ClaimTokenSelect'

interface ClaimInputProps {
  disabled?: boolean
  balance?: string
}

export const ClaimInput = (props: ClaimInputProps) => {
  const type = useRootSelector(getModuleType)

  if (type === ModuleType.ERC721) return <ClaimTokenSelect disabled={props.disabled} />
  return <ClaimAmountInput {...props} />
}
