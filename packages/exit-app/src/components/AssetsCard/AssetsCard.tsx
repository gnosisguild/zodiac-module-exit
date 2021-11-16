import React from 'react'
import { makeStyles, Typography } from '@material-ui/core'
import { AssetsTable } from './AssetsTable'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
    paddingRight: 0,
  },
}))

export const AssetsCard = () => {
  const classes = useStyles()
  return (
    <div className={classes.root}>
      <Typography variant="h4">Select assets to claim</Typography>
      <AssetsTable />
    </div>
  )
}
