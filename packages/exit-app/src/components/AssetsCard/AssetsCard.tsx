import React, { useEffect } from 'react'
import { makeStyles, Typography } from '@material-ui/core'
import { useRootDispatch, useRootSelector } from '../../store'
import { fetchTokenAssets } from '../../store/main/actions'
import { useWallet } from '../../hooks/useWallet'
import { getAssets, getCirculatingSupply, getDesignatedToken } from '../../store/main/selectors'
import { SafeAssets } from '../../store/main/models'
import { AssetsTable } from './AssetsTable'

interface AssetsCardProps {
  safe: string
}

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
    paddingRight: 0,
  },
}))

interface AssetsCardContentProps {
  assets?: SafeAssets
}

const AssetsCardContent = ({ assets }: AssetsCardContentProps) => {
  const token = useRootSelector(getDesignatedToken)
  const circulatingSupply = useRootSelector(getCirculatingSupply)
  if (!assets || !token || !circulatingSupply) {
    return null
  }
  return <AssetsTable assets={assets} token={token} totalSupply={circulatingSupply.value} />
}

export const AssetsCard = ({ safe }: AssetsCardProps) => {
  const classes = useStyles()
  const dispatch = useRootDispatch()
  const { provider } = useWallet()
  const assets = useRootSelector(getAssets)

  useEffect(() => {
    if (provider) dispatch(fetchTokenAssets({ provider, safe }))
  }, [dispatch, provider, safe])

  return (
    <div className={classes.root}>
      <Typography variant="h4">Select assets to claim</Typography>
      <AssetsCardContent assets={assets} />
    </div>
  )
}
