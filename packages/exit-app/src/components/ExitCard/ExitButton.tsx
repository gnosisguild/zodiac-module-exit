import ArrowUpIcon from '../../assets/icons/arrow-up.svg'
import { Button, CircularProgress, makeStyles } from '@material-ui/core'
import React, { useState } from 'react'
import { PopulatedTransaction } from 'ethers'
import SafeAppsSDK from '@gnosis.pm/safe-apps-sdk'
import { useRootDispatch, useRootSelector } from '../../store'
import { getChainId, getClaimAmount, getExitStep, getWalletAddress } from '../../store/main/selectors'
import { _signer, useWallet } from '../../hooks/useWallet'
import { Transaction as SafeTransaction } from '@gnosis.pm/safe-apps-sdk/dist/src/types'
import { useExit } from '../../hooks/useExit'
import { ErrorBox } from './ErrorBox'
import { EXIT_STEP } from '../../store/main/models'
import { setExitStep } from '../../store/main'
import { ReactComponent as CheckMark } from '../../assets/icons/check-mark.svg'
import classNames from 'classnames'
import { checkWalletNetwork } from '../../services/wallet'
import { getNetworkName } from '../../utils/networks'

const EXIT_STEP_MESSAGE: Record<EXIT_STEP, string> = {
  [EXIT_STEP.EXIT]: 'Exit and Claim Assets',
  [EXIT_STEP.APPROVE]: 'Approve token expense',
  [EXIT_STEP.APPROVING]: 'Approving...',
  [EXIT_STEP.WAITING]: 'Exiting...',
  [EXIT_STEP.EXITED]: 'Exit Successful',
  [EXIT_STEP.TX_CREATED]: 'Exit Transaction Created',
  [EXIT_STEP.ERROR]: 'Exit and Claim Assets',
}

function convertTxToSafeTx(tx: PopulatedTransaction): SafeTransaction {
  return {
    to: tx.to as string,
    value: '0',
    data: tx.data as string,
  }
}

interface ExitButtonProps {
  onExit(): void
}

const useStyles = makeStyles((theme) => ({
  btnSuccess: {
    backgroundColor: 'rgba(75, 146, 74, 0.1) !important',
    color: theme.palette.text.primary + ' !important',
  },
  errorBox: {
    marginTop: theme.spacing(1.5),
  },
}))

const ExitButtonIcon = ({ step }: { step: EXIT_STEP }) => {
  if (step === EXIT_STEP.EXIT || step === EXIT_STEP.ERROR) return <img src={ArrowUpIcon} alt="arrow up" />
  if (step === EXIT_STEP.EXITED || step === EXIT_STEP.TX_CREATED) return <CheckMark />

  const loading = [EXIT_STEP.WAITING, EXIT_STEP.APPROVING, EXIT_STEP.APPROVE].includes(step)
  if (loading) return <CircularProgress size={20} color="inherit" />

  return null
}

export const ExitButton = ({ onExit }: ExitButtonProps) => {
  const classes = useStyles()
  const { onboard } = useWallet()
  const dispatch = useRootDispatch()
  const exit = useExit()

  const claimAmount = useRootSelector(getClaimAmount)
  const wallet = useRootSelector(getWalletAddress)
  const step = useRootSelector(getExitStep)
  const network = useRootSelector(getChainId)

  const [error, setError] = useState<string>()

  const handleUserExit = async () => {
    if (!exit) return
    if (await exit.needsApproval()) {
      dispatch(setExitStep(EXIT_STEP.APPROVE))
      const populatedTx = await exit.approve()
      const tx = await _signer.sendTransaction(populatedTx)
      dispatch(setExitStep(EXIT_STEP.APPROVING))
      await tx.wait(2)
    }
    dispatch(setExitStep(EXIT_STEP.WAITING))
    const exitPopulatedTx = await exit.exit()
    const exitTx = await _signer.sendTransaction(exitPopulatedTx)
    await exitTx.wait(4)
    dispatch(setExitStep(EXIT_STEP.EXITED))
    onExit()
  }

  const handleSafeExit = async () => {
    if (!exit) return
    const txs: PopulatedTransaction[] = []
    if (await exit.needsApproval()) {
      txs.push(await exit.approve())
    }
    txs.push(await exit.exit())

    const safeSDK = new SafeAppsSDK()
    await safeSDK.txs.send({ txs: txs.map(convertTxToSafeTx) })
    dispatch(setExitStep(EXIT_STEP.TX_CREATED))
  }

  const handleExit = async () => {
    try {
      const checkNetwork = await checkWalletNetwork(network)
      if (!checkNetwork) {
        const networkName = getNetworkName(network)
        dispatch(setExitStep(EXIT_STEP.ERROR))
        setError('Change current network to ' + networkName)
        return
      }

      const { wallet } = onboard.getState()
      if (wallet.type === 'sdk' && wallet.name === 'Gnosis Safe') {
        await handleSafeExit()
      } else {
        await handleUserExit()
      }
    } catch (err) {
      console.warn('error exiting', err)
      setError(err.message)
      dispatch(setExitStep(EXIT_STEP.ERROR))
    }
  }

  const isButtonDisabled =
    !wallet ||
    claimAmount === '0' ||
    [EXIT_STEP.APPROVE, EXIT_STEP.APPROVING, EXIT_STEP.WAITING, EXIT_STEP.EXITED, EXIT_STEP.TX_CREATED].includes(step)

  return (
    <>
      <Button
        fullWidth
        size="large"
        color="secondary"
        variant="contained"
        onClick={handleExit}
        disabled={isButtonDisabled}
        className={classNames({
          [classes.btnSuccess]: step === EXIT_STEP.EXITED || step === EXIT_STEP.TX_CREATED,
        })}
        startIcon={<ExitButtonIcon step={step} />}
      >
        {EXIT_STEP_MESSAGE[step]}
      </Button>
      {step === EXIT_STEP.ERROR && error ? <ErrorBox className={classes.errorBox} message={error} /> : null}
    </>
  )
}
