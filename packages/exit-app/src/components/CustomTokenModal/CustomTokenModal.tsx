import React, { useEffect } from 'react'
import { Button, makeStyles, Modal, ModalProps, Paper, Typography } from '@material-ui/core'
import { ZodiacTextField } from 'zodiac-ui-components'
import { ReactComponent as ArrowUp } from '../../assets/icons/arrow-up.svg'
import { useForm } from 'react-hook-form'
import { Token, TokenType } from '../../store/main/models'
import { ethers } from 'ethers'
import { useWallet } from '../../hooks/useWallet'
import { getERC20Token } from '../../services/module'
import { useRootDispatch } from '../../store'
import { addCustomToken } from '../../store/main'

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    padding: theme.spacing(2),
    width: '90%',
    maxWidth: 420,
    background: 'rgba(78, 72, 87, 0.8)',
    border: '1px solid rgba(217, 212, 173, 0.3)',
  },
  backdrop: {
    backdropFilter: 'blur(4px)',
  },
  input: {
    padding: theme.spacing(1.5, 0, 1.5, 1),
    '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
      '-webkit-appearance': 'none',
      margin: 0,
    },
  },
  spacing: {
    marginTop: theme.spacing(2),
  },
}))

type CustomTokenForm = Pick<Token, 'address' | 'symbol' | 'decimals'>

export const CustomTokenModal = (props: Omit<ModalProps, 'children'>) => {
  const classes = useStyles()
  const { provider } = useWallet()
  const dispatch = useRootDispatch()

  const { register, setValue, formState, watch, handleSubmit } = useForm<CustomTokenForm>()
  const { errors } = formState

  const address = watch('address')
  const symbol = watch('symbol')
  const decimals = watch('decimals')

  useEffect(() => {
    register('address', {
      validate(value) {
        if (!value?.length) return 'Required field'
        return ethers.utils.isAddress(value) || 'Invalid address'
      },
    })
    register('symbol', {
      validate(value) {
        if (!value?.length) return 'Required field'
      },
    })
    register('decimals', {
      validate(value) {
        return (value > 0 && value % 1 === 0) || 'Only positive integers are allowed'
      },
    })
  }, [register])

  useEffect(() => {
    if (provider && ethers.utils.isAddress(address)) {
      getERC20Token(provider, address)
        .then((token) => {
          setValue('symbol', token.symbol)
          setValue('decimals', token.decimals)
        })
        .catch(console.warn)
    }
  }, [address, provider, setValue])

  const onSubmit = handleSubmit((token) => {
    dispatch(addCustomToken({ type: TokenType.ERC20, ...token }))
    props?.onClose && props.onClose({}, 'escapeKeyDown')
  })

  return (
    <Modal
      {...props}
      className={classes.root}
      BackdropProps={{
        className: classes.backdrop,
        invisible: true,
      }}
    >
      <Paper className={classes.container}>
        <Typography variant="h5">Add Custom Token</Typography>
        <Typography variant="subtitle1">This will add the token to the list of claimable assets.</Typography>
        <ZodiacTextField
          className={classes.spacing}
          InputProps={{ className: classes.input }}
          label="Token Contract Address"
          placeholder="0x325a2e0f3cca2ddbaebb4dfc38df8d19ca16"
          value={address}
          error={!!errors.address}
          helperText={errors.address?.message}
          onChange={(evt) => setValue('address', evt.target.value)}
        />
        <ZodiacTextField
          className={classes.spacing}
          InputProps={{ className: classes.input }}
          label="Token Symbol"
          placeholder="$CUSTOM"
          error={!!errors.symbol}
          helperText={errors.symbol?.message}
          value={symbol}
          onChange={(evt) => setValue('symbol', evt.target.value)}
        />
        <ZodiacTextField
          type="number"
          className={classes.spacing}
          InputProps={{ className: classes.input }}
          label="Token Decimals"
          placeholder="18"
          error={!!errors.decimals}
          helperText={errors.decimals?.message}
          value={decimals}
          onChange={(evt) => setValue('decimals', parseFloat(evt.target.value))}
        />
        <Button
          fullWidth
          size="large"
          color="secondary"
          variant="contained"
          className={classes.spacing}
          startIcon={<ArrowUp />}
          onClick={onSubmit}
        >
          Add Token
        </Button>
      </Paper>
    </Modal>
  )
}
