import React, { useState } from 'react'
import { Grid, makeStyles } from '@material-ui/core'
import { ExitCard } from './components/ExitCard/ExitCard'
import { AssetsCard } from './components/AssetsCard/AssetsCard'
import { useExitModule } from './hooks/useExitModule'
import { Header } from './components/Header/Header'
import { AttachAccount } from './components/AttachAccount/AttachAccount'

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
  const [account] = useState<string>()
  console.log({ loading, module })

  const content = account ? (
    <Grid container spacing={1} className={classes.container}>
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
  ) : (
    <AttachAccount />
  )

  return (
    <div className={classes.root}>
      <Header />
      <div className={classes.space}>{content}</div>
    </div>
  )
}
