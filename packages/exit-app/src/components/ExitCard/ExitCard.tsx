import React, { useEffect, useState } from 'react'
import { makeStyles, Typography } from '@material-ui/core'
import { ValueLine } from '../commons/ValueLine'
import classNames from 'classnames'
import { ReactComponent as QuestionIcon } from '../../assets/icons/question-icon.svg'
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
import { fetchExitModuleData, getAvailableTokens } from '../../store/main/actions'
import { TextAmount } from '../commons/text/TextAmount'
import { fiatFormatter, formatBalance } from '../../utils/format'
import { useClaimRate } from '../../hooks/useClaimRate'
import { ClaimInput } from './input/ClaimInput'
import { ExitButton } from './ExitButton'

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

  const [balance, setBalance] = useState<BigNumber>()

  const assets = useRootSelector(getAssets)
  const module = useRootSelector(getModule)
  const wallet = useRootSelector(getWalletAddress)
  const token = useRootSelector(getDesignatedToken)
  const circulatingSupply = useRootSelector(getCirculatingSupply)

  const claimRate = useClaimRate()

  useEffect(() => {
    if (wallet && token && provider) {
      getTokenBalance(provider, token.address, wallet)
        .then((_balance) => setBalance(_balance))
        .catch((err) => console.error('getTokenBalance:', err))
    }
  }, [wallet, token, provider])

  useEffect(() => {
    if (provider && module) {
      dispatch(fetchExitModuleData({ provider, module }))
    }
  }, [module, dispatch, provider])

  const loader = <Skeleton className={classes.loader} variant="text" width={80} />
  const loading = !token || !circulatingSupply
  const tokenSymbol = loading ? loader : token?.symbol
  const claimableAmount = fiatFormatter.format(parseFloat(assets.fiatTotal) * claimRate)

  const handleExit = async () => {
    if (!provider || !token || !wallet || !module) return
    // Update Token Balance
    setBalance(await getTokenBalance(provider, token.address, wallet))
    dispatch(fetchExitModuleData({ provider, module }))
    dispatch(getAvailableTokens({ token: token.address, wallet }))
  }

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

      <WalletAssets className={classNames(classes.spacing, classes.content)} balance={balance} />

      <ClaimInput balance={balance} />

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
    </div>
  )
}
