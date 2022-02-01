import ArrowUpIcon from '../../assets/icons/arrow-up.svg'
import { Button, CircularProgress } from '@material-ui/core'
import React, { useState } from 'react'
import { PopulatedTransaction } from 'ethers'
import SafeAppsSDK from '@gnosis.pm/safe-apps-sdk'
import { useRootSelector } from '../../store'
import { getClaimAmount, getWalletAddress } from '../../store/main/selectors'
import { _signer, useWallet } from '../../hooks/useWallet'
import { Transaction as SafeTransaction } from '@gnosis.pm/safe-apps-sdk/dist/src/types'
import { useExit } from '../../hooks/useExit'

enum EXIT_STEP {
  EXIT,
  APPROVE,
  APPROVING,
  WAITING,
}

const EXIT_STEP_MESSAGE: Record<EXIT_STEP, string> = {
  [EXIT_STEP.EXIT]: 'Exit and Claim Assets',
  [EXIT_STEP.APPROVE]: 'Approve token expense',
  [EXIT_STEP.APPROVING]: 'Approving...',
  [EXIT_STEP.WAITING]: 'Exiting...',
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

export const ExitButton = ({ onExit }: ExitButtonProps) => {
  const { onboard } = useWallet()
  const EXIT = useExit()

  const claimAmount = useRootSelector(getClaimAmount)
  const wallet = useRootSelector(getWalletAddress)

  const [step, setStep] = useState<EXIT_STEP>(EXIT_STEP.EXIT)

  const handleUserExit = async () => {
    if (!EXIT) return
    if (await EXIT.needsApproval()) {
      setStep(EXIT_STEP.APPROVE)
      const populatedTx = await EXIT.approve()
      const tx = await _signer.sendTransaction(populatedTx)
      setStep(EXIT_STEP.APPROVING)
      await tx.wait(2)
    }
    setStep(EXIT_STEP.WAITING)
    const exitPopulatedTx = await EXIT.exit()
    const exitTx = await _signer.sendTransaction(exitPopulatedTx)
    await exitTx.wait(2)
    onExit()
  }

  const handleSafeExit = async () => {
    if (!EXIT) return
    const txs: PopulatedTransaction[] = []
    if (await EXIT.needsApproval()) {
      txs.push(await EXIT.approve())
    }
    txs.push(await EXIT.exit())

    const safeSDK = new SafeAppsSDK()
    await safeSDK.txs.send({ txs: txs.map(convertTxToSafeTx) })
  }

  const handleExit = async () => {
    try {
      const { wallet } = onboard.getState()
      if (wallet.type === 'sdk' && wallet.name === 'Gnosis Safe') {
        await handleSafeExit()
      } else {
        await handleUserExit()
      }
    } catch (err) {
      console.warn('error exiting', err)
    } finally {
      setStep(EXIT_STEP.EXIT)
    }
  }

  const isButtonDisabled = step !== EXIT_STEP.EXIT || !wallet || claimAmount === '0'

  return (
    <Button
      fullWidth
      disabled={isButtonDisabled}
      size="large"
      color="secondary"
      variant="contained"
      startIcon={
        step === EXIT_STEP.EXIT ? (
          <img src={ArrowUpIcon} alt="arrow up" />
        ) : (
          <CircularProgress size={20} color="inherit" />
        )
      }
      onClick={handleExit}
    >
      {EXIT_STEP_MESSAGE[step]}
    </Button>
  )
}
