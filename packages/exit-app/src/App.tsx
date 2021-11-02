import React from 'react'
import { Grid, makeStyles } from '@material-ui/core'
import { ExitCard } from './components/ExitCard/ExitCard'
import { AssetsCard } from './components/AssetsCard/AssetsCard'
import { useExitModule } from './hooks/useExitModule'
import { Header } from './components/Header/Header'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  container: {
    position: 'relative',
    '&::before': {
      content: '" "',
      position: 'absolute',
      zIndex: -1,
      top: '-2px',
      left: '-2px',
      right: '-2px',
      bottom: '-2px',
      border: '1px solid rgba(217, 212, 173, 0.3)',
    },
  },
  item: {
    border: '1px solid rgba(217, 212, 173, 0.3)',
    padding: theme.spacing(2),
    height: '100%',
  },
  space: {
    marginTop: theme.spacing(3),
    padding: theme.spacing(1),
  },
}))

export const App = (): React.ReactElement => {
  const classes = useStyles()
  const { loading, module } = useExitModule()
  console.log({ loading, module })

  return (
    <div className={classes.root}>
      <Header />
      <div className={classes.space}>
        <Grid container spacing={1} className={classes.container}>
          {/*<OnboardButton />*/}
          <Grid item xs={4}>
            <div className={classes.item}>
              <ExitCard />
            </div>
          </Grid>
          <Grid item xs={8}>
            <div className={classes.item}>
              <AssetsCard />
            </div>
          </Grid>
        </Grid>
      </div>
    </div>
  )
}
