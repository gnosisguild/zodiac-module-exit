import React from 'react'
import { Typography } from '@material-ui/core'
import { AssetsTable } from './AssetsTable'

export const AssetsCard = () => {
  return (
    <>
      <Typography variant="h4">Select assets to claim</Typography>
      <AssetsTable />
    </>
  )
}
