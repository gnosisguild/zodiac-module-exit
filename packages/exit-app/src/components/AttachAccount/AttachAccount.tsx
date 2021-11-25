import { Button, makeStyles, Paper, Typography } from '@material-ui/core'
import { TextField } from '../commons/input/TextField'
import { ReactComponent as ArrowUp } from '../../assets/icons/arrow-up.svg'
import { useRootDispatch } from '../../store'
import { useState } from 'react'
import { ethers } from 'ethers'
import { setAccount } from '../../store/main'

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    maxWidth: 400,
    marginTop: theme.spacing(16),
    padding: theme.spacing(1.5),
  },
  spacing: {
    marginBottom: theme.spacing(2),
  },
}))

export const AttachAccount = () => {
  const classes = useStyles()
  const dispatch = useRootDispatch()
  const [account, _setAccount] = useState('')
  const isValid = ethers.utils.isAddress(account)

  const handleAttach = () => {
    dispatch(setAccount(account))
  }

  return (
    <div className={classes.root}>
      <Paper classes={{ root: classes.card }}>
        <Typography className={classes.spacing} variant="h4">
          Attach an Exit enabled Account
        </Typography>
        <Typography className={classes.spacing} variant="body1">
          Once an account is attached, you will be able to select the assets to claim, and pull them from the safe (in
          proportion to the amount of a designated token you hold).
        </Typography>

        <TextField
          className={classes.spacing}
          onChange={(evt) => _setAccount(evt.target.value)}
          label="Account Address"
          placeholder="0x59C945953C10AbC7f3716a8cECd09b5eb4d865Ca"
        />

        <Button
          disabled={!isValid}
          fullWidth
          variant="contained"
          color="secondary"
          startIcon={<ArrowUp />}
          onClick={handleAttach}
        >
          Attach Account
        </Button>
      </Paper>
    </div>
  )
}
