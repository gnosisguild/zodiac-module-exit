import { TextField } from '../commons/input/TextField'
import React, { useState } from 'react'
import { setClaimAmount } from '../../store/main'
import { useRootDispatch, useRootSelector } from '../../store'
import { getDesignatedToken } from '../../store/main/selectors'
import { makeStyles } from '@material-ui/core'
import { ethers } from 'ethers'

const useStyles = makeStyles((theme) => ({
  spacing: {
    marginTop: theme.spacing(2.5),
  },
  claimInput: {
    fontSize: '16px !important',
  },
}))

export const ClaimAmountInput = () => {
  const classes = useStyles()
  const dispatch = useRootDispatch()
  const token = useRootSelector(getDesignatedToken)

  const [amount, setAmount] = useState('')

  const handleExitAmount = (value: string) => {
    try {
      const _value = value || '0'
      ethers.utils.parseUnits(_value, token?.decimals || 18)
      setAmount(value)
      dispatch(setClaimAmount(_value))
    } catch (err) {}
  }

  return (
    <TextField
      placeholder="0.0"
      color="secondary"
      label="Exit Amount"
      className={classes.spacing}
      InputProps={{
        classes: { input: classes.claimInput },
        inputMode: 'decimal',
        autoComplete: 'off',
        autoCorrect: 'off',
        spellCheck: 'false',
      }}
      append={token?.symbol || ''}
      value={amount}
      onChange={(evt) => handleExitAmount(evt.target.value)}
    />
  )
}
