import React, { useEffect, useState } from 'react'
import { Button, makeStyles, Typography } from '@material-ui/core'
import { ValueLine } from '../commons/ValueLine'
import classNames from 'classnames'
import { ReactComponent as ExternalIcon } from '../../assets/icons/external-icon.svg'
import { ReactComponent as QuestionIcon } from '../../assets/icons/question-icon.svg'
import { Skeleton } from '@material-ui/lab'
import ArrowUpIcon from '../../assets/icons/arrow-up.svg'
import { WalletAssets } from './WalletAssets'
import { useRootDispatch, useRootSelector } from '../../store'
import {
  getAssets,
  getCirculatingSupply,
  getClaimAmount,
  getDesignatedToken,
  getModule,
  getSelectedTokens,
  getWalletAddress,
} from '../../store/main/selectors'
import { useWallet } from '../../hooks/useWallet'
import { BigNumber, ethers } from 'ethers'
import { getTokenBalance } from '../../services/module'
import { fetchExitModuleData } from '../../store/main/actions'
import { TextAmount } from '../commons/text/TextAmount'
import { SafeAssets, Token } from '../../store/main/models'
import { fiatFormatter, sortBigNumberArray } from '../../utils/format'
import { ClaimAmountInput } from './ClaimAmountInput'
import { getClaimableAmount } from '../../utils/math'
import { Erc20__factory, ZodiacModuleExit__factory } from '../../contracts/types'

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

function getFiatDaoAsset(token?: Token, assets?: SafeAssets) {
  if (!assets || !token) return
  const tokenAsset = assets.items.find((asset) => asset.tokenInfo.address === token.address)
  if (!tokenAsset) return '0'
  return fiatFormatter.format(parseFloat(tokenAsset.fiatBalance))
}

export const ExitCard = (): React.ReactElement => {
  const classes = useStyles()
  const { provider } = useWallet()
  const dispatch = useRootDispatch()

  const [balance, setBalance] = useState<BigNumber>()

  const module = useRootSelector(getModule)
  const wallet = useRootSelector(getWalletAddress)
  const token = useRootSelector(getDesignatedToken)
  const circulatingSupply = useRootSelector(getCirculatingSupply)
  const assets = useRootSelector(getAssets)
  const selectedTokens = useRootSelector(getSelectedTokens)
  const claimAmount = useRootSelector(getClaimAmount)

  const fiatDaoAsset = getFiatDaoAsset(token, assets)
  const claimableAmount = getClaimableAmount(token, assets, balance)

  const handleExit = async () => {
    const signer = await provider?.getSigner()
    if (signer && wallet && module && token) {
      const weiAmount = ethers.utils.parseUnits(claimAmount, token.decimals)

      const ERC20 = Erc20__factory.connect(token.address, signer)
      const allowance = await ERC20.allowance(wallet, module)

      if (allowance.lt(weiAmount)) {
        const tx = await ERC20.approve(module, weiAmount)
        await tx.wait(4)
      }

      const claimTokens = sortBigNumberArray(selectedTokens)
        .filter((token) => !token.isZero())
        .map((token) => token.toHexString())

      const exitModule = ZodiacModuleExit__factory.connect(module, signer)
      const exitTx = await exitModule.exit(weiAmount, claimTokens)
      await exitTx.wait(5)
      alert('exit successful')
    }
  }

  useEffect(() => {
    if (wallet && token && provider) {
      getTokenBalance(provider, token.address, wallet).then((_balance) => setBalance(_balance))
    }
  }, [wallet, token, provider])

  const loader = <Skeleton className={classes.loader} variant="text" width={80} />
  const tokenSymbol = token ? token.symbol : loader

  useEffect(() => {
    if (provider && module) {
      dispatch(fetchExitModuleData({ provider, module }))
    }
  }, [module, dispatch, provider])

  return (
    <div className={classes.root}>
      <Typography variant="body1" className={classes.description}>
        Redeem your {tokenSymbol} tokens for a share of the DAOs assets.
      </Typography>

      <div className={classNames(classes.spacing, classes.content)}>
        <ValueLine
          label="Circulating Supply"
          loading={!circulatingSupply}
          value={
            circulatingSupply &&
            token && (
              <TextAmount>
                {ethers.utils.formatUnits(circulatingSupply.value, token.decimals)} {token.symbol}
              </TextAmount>
            )
          }
        />
        <ValueLine
          label="DAO Assets Value"
          icon={<ExternalIcon />}
          loading={!circulatingSupply}
          value={fiatDaoAsset && <TextAmount>~${fiatDaoAsset}</TextAmount>}
        />
      </div>

      <WalletAssets className={classNames(classes.spacing, classes.content)} balance={balance} />

      <ClaimAmountInput />

      <div className={classNames(classes.spacing, classes.content)}>
        <ValueLine
          label="Claimable Value"
          icon={<QuestionIcon />}
          loading={!claimableAmount}
          value={fiatDaoAsset && <TextAmount>~${claimableAmount}</TextAmount>}
        />
      </div>

      <Button
        fullWidth
        size="large"
        color="secondary"
        variant="contained"
        className={classes.spacing}
        startIcon={<img src={ArrowUpIcon} alt="arrow up" />}
        onClick={handleExit}
      >
        Exit and Claim Assets
      </Button>
    </div>
  )
}
