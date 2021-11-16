import React from 'react'
import ReactDOM from 'react-dom'
import { ThemeProvider } from 'styled-components'
import { createTheme, CssBaseline, ThemeProvider as MUIThemeProvider } from '@material-ui/core'
import { theme as gnosisTheme } from '@gnosis.pm/safe-react-components'
import GlobalStyle from './GlobalStyle'
import { App } from './App'
import { ZodiacThemeOptions } from 'zodiac-ui'

const AppTheme = createTheme(ZodiacThemeOptions)

const Main = () => {
  return (
    <MUIThemeProvider theme={AppTheme}>
      <ThemeProvider theme={gnosisTheme}>
        <CssBaseline />
        {/*<ZodiacGlobalStyle />*/}
        <GlobalStyle />
        {/*<SafeProvider*/}
        {/*  loader={*/}
        {/*    <Row alignItems="center" justifyContent="center" height="100%">*/}
        {/*      <Loader size="md" />*/}
        {/*    </Row>*/}
        {/*  }*/}
        {/*>*/}
        <App />
        {/*</SafeProvider>*/}
      </ThemeProvider>
    </MUIThemeProvider>
  )
}

ReactDOM.render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>,
  document.getElementById('root'),
)
