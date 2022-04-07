import React from 'react'
import { ValueLine } from '../commons/ValueLine'
import classNames from 'classnames'
import { Button, ButtonProps, makeStyles } from '@material-ui/core'
import { useWallet } from '../../hooks/useWallet'
import { useRootSelector } from '../../store'
import { getAssets, getBalance, getCirculatingSupply, getDesignatedToken } from '../../store/main/selectors'
import { TextAmount } from '../commons/text/TextAmount'
import { formatBalance } from '../../utils/format'
import { getClaimableAmount } from '../../utils/math'

interface WalletAssetsProps {
  className?: string
}

interface ConnectWalletProps {
  className: string
  onClick?: ButtonProps['onClick']
}

const useStyles = makeStyles(() => ({
  root: {
    position: 'relative',
  },
  connectWallet: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
    backgroundColor: 'rgba(217, 212, 173, 0.3)',
    backdropFilter: 'blur(4px)',
  },
}))

const ConnectWallet = ({ className, onClick }: ConnectWalletProps) => {
  return (
    <div className={className}>
      <Button size="large" variant="contained" color="secondary" onClick={onClick}>
        Connect Wallet
      </Button>
    </div>
  )
}

export const WalletAssets = ({ className }: WalletAssetsProps) => {
  const classes = useStyles()

  const { startOnboard } = useWallet()
  const token = useRootSelector(getDesignatedToken)
  const assets = useRootSelector(getAssets)
  const balance = useRootSelector(getBalance)
  const circulatingSupply = useRootSelector(getCirculatingSupply)

  const balanceText = formatBalance(balance, token)
  const marketValue = getClaimableAmount(token, assets, balance, circulatingSupply?.value)

  return (
    <div className={classNames(className, classes.root)}>
      {balance ? null : <ConnectWallet className={classes.connectWallet} onClick={startOnboard} />}
      <ValueLine
        label="Your Balance"
        loading={!balanceText}
        value={
          balanceText ? (
            <TextAmount>
              {balanceText} {token?.symbol}
            </TextAmount>
          ) : null
        }
      />
      <ValueLine
        label="Market Value"
        loading={!marketValue}
        value={marketValue && <TextAmount>~${marketValue}</TextAmount>}
      />
    </div>
  )
}
