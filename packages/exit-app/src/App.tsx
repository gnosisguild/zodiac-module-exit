import React from 'react'
import { makeStyles } from '@material-ui/core'
import { Header } from './components/Header/Header'
import { AttachAccount } from './components/AttachAccount/AttachAccount'
import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom'
import { Dashboard } from './components/Dashboard/Dashboard'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  space: {
    marginTop: theme.spacing(3),
  },
}))

export const App = (): React.ReactElement => {
  const classes = useStyles()

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <div className={classes.root}>
              <Header />
              <div className={classes.space}>
                <Outlet />
              </div>
            </div>
          }
        >
          <Route path=":account" element={<Dashboard />} />
          <Route path="/" element={<AttachAccount />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
