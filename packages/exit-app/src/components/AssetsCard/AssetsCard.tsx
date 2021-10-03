import React from 'react'
import { Card, CardContent, Typography } from '@material-ui/core'
import { AssetsTable } from './AssetsTable'

export const AssetsCard = () => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h3">Select assets to claim</Typography>
        <AssetsTable />
      </CardContent>
    </Card>
  )
}
