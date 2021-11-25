import React, { useEffect, useState } from 'react'
import { Button, makeStyles, Typography } from '@material-ui/core'
import { ValueLine } from '../commons/ValueLine'
import classNames from 'classnames'
import { ReactComponent as ExternalIcon } from '../../assets/icons/external-icon.svg'
import { ReactComponent as QuestionIcon } from '../../assets/icons/question-icon.svg'
import { Skeleton } from '@material-ui/lab'
import { TextField } from '../commons/input/TextField'
import ArrowUpIcon from '../../assets/icons/arrow-up.svg'
import { WalletAssets } from './WalletAssets'
import { useRootDispatch, useRootSelector } from '../../store'
import { getAccount, getCirculatingSupply, getToken, getWalletAddress } from '../../store/main/selectors'
import { useWallet } from '../../hooks/useWallet'
import { BigNumber, ethers } from 'ethers'
import { getTokenBalance } from '../../services/module'
import { fetchExitModuleData } from '../../store/main/actions'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
  },
  spacing: {
    marginTop: theme.spacing(2.5),
  },
  description: {
    maxWidth: 300,
  },
  content: {
    border: '1px solid rgba(217, 212, 173, 0.3)',
    padding: theme.spacing(1.5),
  },
  loader: {
    display: 'inline-block',
    transform: 'none',
  },
}))

export const ExitCard = (): React.ReactElement => {
  const classes = useStyles()
  const account = useRootSelector(getAccount)
  const wallet = useRootSelector(getWalletAddress)
  const token = useRootSelector(getToken)
  const circulatingSupply = useRootSelector(getCirculatingSupply)

  const [balance, setBalance] = useState<BigNumber>()

  const dispatch = useRootDispatch()
  const { provider } = useWallet()

  useEffect(() => {
    if (wallet && token && provider) {
      getTokenBalance(provider, token.address, wallet).then((_balance) => setBalance(_balance))
    }
  }, [wallet, token, provider])

  const loader = <Skeleton className={classes.loader} variant="text" width={80} />
  const tokenSymbol = token ? token.symbol : loader

  useEffect(() => {
    if (provider && account) {
      dispatch(fetchExitModuleData({ provider, module: account }))
    }
  }, [account, dispatch, provider])

  return (
    <div className={classes.root}>
      <Typography variant="body1" className={classes.description}>
        Redeem your {tokenSymbol} tokens for a share of the DAOs assets.
      </Typography>

      <div className={classNames(classes.spacing, classes.content)}>
        <ValueLine
          label="Circulating Supply"
          loading={!circulatingSupply}
          value={circulatingSupply && token && ethers.utils.formatUnits(circulatingSupply.value, token.decimals)}
        />
        <ValueLine label="DAO Assets Value" icon={<ExternalIcon />} loading={!circulatingSupply} />
      </div>

      <WalletAssets className={classNames(classes.spacing, classes.content)} balance={balance} />

      <TextField color="secondary" className={classes.spacing} label="Exit Amount" />

      <div className={classNames(classes.spacing, classes.content)}>
        <ValueLine label="Claimable Value" icon={<QuestionIcon />} loading={!wallet} />
      </div>

      <Button
        fullWidth
        size="large"
        color="secondary"
        variant="contained"
        className={classes.spacing}
        startIcon={<img src={ArrowUpIcon} alt="arrow up" />}
      >
        Exit and Claim Assets
      </Button>
    </div>
  )
}
