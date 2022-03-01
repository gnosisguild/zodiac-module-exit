import { ClaimInput } from './input/ClaimInput'
import classNames from 'classnames'
import { ValueLine } from '../commons/ValueLine'
import { ReactComponent as QuestionIcon } from '../../assets/icons/question-icon.svg'
import { TextAmount } from '../commons/text/TextAmount'
import { ExitButton } from './ExitButton'
import React from 'react'
import { fiatFormatter } from '../../utils/format'
import { getTokenBalance } from '../../services/module'
import { fetchExitModuleData, fetchTokenAssets, getAvailableTokens } from '../../store/main/actions'
import { useAmountRate } from '../../hooks/useAmountRate'
import { useRootDispatch, useRootSelector } from '../../store'
import {
  getAccount,
  getAssets,
  getBalance,
  getChainId,
  getDesignatedToken,
  getExitStep,
  getModule,
  getWalletAddress,
} from '../../store/main/selectors'
import { useWallet } from '../../hooks/useWallet'
import { setBalance } from '../../store/main'
import { makeStyles } from '@material-ui/core'
import { EXIT_STEP } from '../../store/main/models'
import { BigNumber, ethers } from 'ethers'

interface ExitFormProps {
  loading?: boolean
}

const useStyles = makeStyles((theme) => ({
  spacing: {
    marginTop: theme.spacing(2.5),
  },
  content: {
    border: '1px solid rgba(217, 212, 173, 0.3)',
    padding: theme.spacing(1.5),
  },
}))

export const ExitForm = ({ loading }: ExitFormProps) => {
  const getClaimAmount = useAmountRate()
  const { provider } = useWallet()

  const dispatch = useRootDispatch()
  const classes = useStyles()

  const token = useRootSelector(getDesignatedToken)
  const wallet = useRootSelector(getWalletAddress)
  const assets = useRootSelector(getAssets)
  const account = useRootSelector(getAccount)
  const module = useRootSelector(getModule)
  const balance = useRootSelector(getBalance)
  const network = useRootSelector(getChainId)
  const step = useRootSelector(getExitStep)

  const claimRate = parseFloat(ethers.utils.formatUnits(getClaimAmount(BigNumber.from(10).pow(18)), 18))
  const claimableAmount = fiatFormatter.format(parseFloat(assets.fiatTotal) * claimRate)

  const handleExit = async () => {
    if (!provider || !token || !wallet || !module || !account) return
    // Update Token Balance
    dispatch(setBalance(await getTokenBalance(provider, token.address, wallet)))
    dispatch(fetchExitModuleData({ provider, module }))
    dispatch(fetchTokenAssets({ provider, safe: account }))
    dispatch(getAvailableTokens({ token: token.address, network, wallet }))
  }

  const disabled = ![EXIT_STEP.EXIT, EXIT_STEP.EXITED, EXIT_STEP.TX_CREATED, EXIT_STEP.ERROR].includes(step)

  return (
    <>
      <ClaimInput balance={balance} disabled={disabled} />
      <div className={classNames(classes.spacing, classes.content)}>
        <ValueLine
          label="Claimable Value"
          icon={<QuestionIcon />}
          loading={loading}
          value={<TextAmount>~${claimableAmount}</TextAmount>}
        />
      </div>
      <div className={classes.spacing} />
      <ExitButton onExit={handleExit} />
    </>
  )
}
