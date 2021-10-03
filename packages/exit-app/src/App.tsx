import React from 'react'
import { Grid, makeStyles } from '@material-ui/core'
import { ExitCard } from './components/ExitCard/ExitCard'
import { AssetsCard } from './components/AssetsCard/AssetsCard'
import { useExitModule } from './hooks/useExitModule'
import { OnboardButton } from './components/OnboardButton'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
}))

export const App = (): React.ReactElement => {
  const classes = useStyles()
  const { loading, module } = useExitModule()
  console.log({ loading, module })

  return (
    <Grid container spacing={3} className={classes.root}>
      <OnboardButton />
      <Grid item xs={4}>
        <ExitCard />
      </Grid>
      <Grid item xs={8}>
        <AssetsCard />
      </Grid>
    </Grid>
  )
}
