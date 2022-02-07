import React, { useEffect } from 'react'
import { makeStyles, Typography } from '@material-ui/core'
import { ValueLine } from '../commons/ValueLine'
import classNames from 'classnames'
import { Skeleton } from '@material-ui/lab'
import { WalletAssets } from './WalletAssets'
import { useRootDispatch, useRootSelector } from '../../store'
import {
  getAssets,
  getCirculatingSupply,
  getDesignatedToken,
  getModule,
  getWalletAddress,
} from '../../store/main/selectors'
import { useWallet } from '../../hooks/useWallet'
import { BigNumber } from 'ethers'
import { getTokenBalance } from '../../services/module'
import { fetchExitModuleData } from '../../store/main/actions'
import { TextAmount } from '../commons/text/TextAmount'
import { fiatFormatter, formatBalance } from '../../utils/format'
import { ExitForm } from './ExitForm'
import { setBalance } from '../../store/main'

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
  const dispatch = useRootDispatch()

  const { provider } = useWallet()

  const assets = useRootSelector(getAssets)
  const module = useRootSelector(getModule)
  const wallet = useRootSelector(getWalletAddress)
  const token = useRootSelector(getDesignatedToken)
  const circulatingSupply = useRootSelector(getCirculatingSupply)

  useEffect(() => {
    if (wallet && token && provider) {
      getTokenBalance(provider, token.address, wallet)
        .then((_balance) => dispatch(setBalance(_balance)))
        .catch((err) => console.error('getTokenBalance:', err))
    }
  }, [wallet, token, provider, dispatch])

  useEffect(() => {
    if (provider && module) {
      dispatch(fetchExitModuleData({ provider, module }))
    }
  }, [module, dispatch, provider])

  const loader = <Skeleton className={classes.loader} variant="text" width={80} />
  const loading = !token || !circulatingSupply
  const tokenSymbol = loading ? loader : token?.symbol

  return (
    <div className={classes.root}>
      <Typography variant="body1" className={classes.description}>
        Redeem your {tokenSymbol} tokens for a share of the DAOs assets.
      </Typography>

      <div className={classNames(classes.spacing, classes.content)}>
        <ValueLine
          label="Circulating Supply"
          loading={loading}
          value={
            circulatingSupply &&
            token && (
              <TextAmount>
                {formatBalance(BigNumber.from(circulatingSupply.value), token)} {token.symbol}
              </TextAmount>
            )
          }
        />
        <ValueLine
          label="DAO Assets Value"
          loading={loading}
          value={<TextAmount>~${fiatFormatter.format(parseFloat(assets.fiatTotal))}</TextAmount>}
        />
      </div>

      <WalletAssets className={classNames(classes.spacing, classes.content)} />

      <ExitForm loading={loading} />
    </div>
  )
}
