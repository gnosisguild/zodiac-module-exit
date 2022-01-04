import { TextField } from '../commons/input/TextField'
import React from 'react'
import { ethers } from 'ethers'
import { setClaimAmount } from '../../store/main'
import { useRootDispatch, useRootSelector } from '../../store'
import { getClaimAmount, getDesignatedToken } from '../../store/main/selectors'
import { makeStyles } from '@material-ui/core'

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
  const claimAmount = useRootSelector(getClaimAmount)
  const token = useRootSelector(getDesignatedToken)

  const handleExitAmount = (value: string) => {
    try {
      if (value === '') value = '0'
      else if (value.startsWith('0') && !value.startsWith('0.') && value.length > 1) value = value.substr(1)
      ethers.utils.parseUnits(value, token?.decimals || 6)
      dispatch(setClaimAmount(value))
    } catch (err) {}
  }

  return (
    <TextField
      color="secondary"
      label="Exit Amount"
      className={classes.spacing}
      InputProps={{ classes: { input: classes.claimInput } }}
      append={token?.symbol}
      value={claimAmount}
      onChange={(evt) => handleExitAmount(evt.target.value)}
    />
  )
}
