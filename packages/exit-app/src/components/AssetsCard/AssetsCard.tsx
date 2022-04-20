import React, { useEffect, useMemo, useState } from 'react'
import { InputAdornment, Link, makeStyles, Typography } from '@material-ui/core'
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined'
import { useRootDispatch, useRootSelector } from '../../store'
import { fetchTokenAssets } from '../../store/main/actions'
import { useWallet } from '../../hooks/useWallet'
import { getAssets, getCustomTokenModalOpen, getCustomTokens, getDesignatedToken } from '../../store/main/selectors'
import { AssetsTable } from './AssetsTable'
import { Row } from '../commons/layout/Row'
import { TextField } from '../commons/input/TextField'
import SearchIcon from '@material-ui/icons/Search'
import { Grow } from '../commons/Grow'
import { CustomTokenModal } from '../CustomTokenModal/CustomTokenModal'
import { TokenAsset } from '../../store/main/models'
import { setCustomTokenModalOpen } from '../../store/main'

interface AssetsCardProps {
  safe?: string
}

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
    paddingRight: 0,
  },
  controls: {
    marginTop: theme.spacing(2.5),
    paddingRight: theme.spacing(2),
    alignItems: 'center',
  },
  search: {
    maxWidth: 240,
  },
  link: {
    color: '#D9D4AD',
    fontSize: 16,
    cursor: 'pointer',
  },
}))

export const AssetsCard = ({ safe }: AssetsCardProps) => {
  const classes = useStyles()
  const dispatch = useRootDispatch()
  const { provider } = useWallet()

  const assets = useRootSelector(getAssets)
  const token = useRootSelector(getDesignatedToken)
  const customTokens = useRootSelector(getCustomTokens)
  const customTokenModalOpen = useRootSelector(getCustomTokenModalOpen)

  const [query, setQuery] = useState('')

  const tokens: TokenAsset[] = useMemo(() => {
    const customAssets = customTokens.map((token): TokenAsset => {
      return { tokenInfo: token, gas: '0', fiatConversion: '0', fiatBalance: '0', balance: '0' }
    })
    return [...customAssets, ...assets.items]
  }, [assets, customTokens])

  useEffect(() => {
    if (provider && safe) dispatch(fetchTokenAssets({ provider, safe }))
  }, [dispatch, provider, safe])

  const handleCustomTokenModalOpen = (open: boolean) => {
    dispatch(setCustomTokenModalOpen(open))
  }

  return (
    <div className={classes.root}>
      <Typography variant="h4">
        Select assets to claim{' '}
        <Link href="https://gnosis.github.io/zodiac/docs/tutorial-module-exit-app/redeemable-assets" target="_blank">
          <InfoOutlinedIcon style={{ color: 'rgba(217, 212, 173, 0.7)' }} />
        </Link>
      </Typography>
      <Row className={classes.controls}>
        <TextField
          placeholder="Filter token list"
          className={classes.search}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          value={query}
          onChange={(evt) => setQuery(evt.target.value)}
        />
        <Grow />
        <Link className={classes.link} onClick={() => handleCustomTokenModalOpen(true)}>
          Add Custom Token
        </Link>
      </Row>
      <AssetsTable fiat={assets.fiatTotal} assets={tokens} token={token} query={query} />
      <CustomTokenModal open={customTokenModalOpen} onClose={() => handleCustomTokenModalOpen(false)} />
    </div>
  )
}
