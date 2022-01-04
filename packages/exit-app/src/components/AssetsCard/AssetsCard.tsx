import React, { useEffect } from 'react'
import { InputAdornment, makeStyles, Typography } from '@material-ui/core'
import { useRootDispatch, useRootSelector } from '../../store'
import { fetchTokenAssets } from '../../store/main/actions'
import { useWallet } from '../../hooks/useWallet'
import { getAssets, getDesignatedToken } from '../../store/main/selectors'
import { AssetsTable } from './AssetsTable'
import { Row } from '../commons/layout/Row'
import { TextField } from '../commons/input/TextField'
import SearchIcon from '@material-ui/icons/Search'

interface AssetsCardProps {
  safe: string
}

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
    paddingRight: 0,
  },
  controls: {
    marginTop: theme.spacing(2.5),
  },
  search: {
    maxWidth: 240,
  },
}))

export const AssetsCard = ({ safe }: AssetsCardProps) => {
  const classes = useStyles()
  const dispatch = useRootDispatch()
  const { provider } = useWallet()
  const assets = useRootSelector(getAssets)
  const token = useRootSelector(getDesignatedToken)

  useEffect(() => {
    if (provider) dispatch(fetchTokenAssets({ provider, safe }))
  }, [dispatch, provider, safe])

  return (
    <div className={classes.root}>
      <Typography variant="h4">Select assets to claim</Typography>
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
        />
      </Row>
      <AssetsTable assets={assets} token={token} />
    </div>
  )
}
