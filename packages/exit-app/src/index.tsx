import React from 'react'
import ReactDOM from 'react-dom'
import { ThemeProvider } from 'styled-components'
import { createTheme, CssBaseline, ThemeProvider as MUIThemeProvider } from '@material-ui/core'
import { Loader, theme as gnosisTheme } from '@gnosis.pm/safe-react-components'
import SafeProvider from '@gnosis.pm/safe-apps-react-sdk'
import GlobalStyle from './GlobalStyle'
import { grey } from '@material-ui/core/colors'
import MUIShadows from '@material-ui/core/styles/shadows'
import createPalette from '@material-ui/core/styles/createPalette'
import { Row } from './components/commons/layout/Row'
import { App } from './App'

const palette = createPalette({
  type: 'light',
  primary: grey,
  background: {
    default: '#F8FAFB',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#001428',
  },
})

palette.secondary = palette.augmentColor({
  '500': gnosisTheme.colors.primary,
})

const shadows = MUIShadows
shadows[1] = '0px 2px 4px rgba(105, 112, 117, 0.2)'
shadows[2] = '0px 4px 4px rgba(0, 0, 0, 0.25)'
shadows[3] = '0px 4px 10px rgba(105, 112, 117, 0.2)'

const muiTheme = createTheme({
  palette,
  shadows,
  typography: {
    fontFamily: gnosisTheme.fonts.fontFamily,
    h3: {
      fontSize: 28,
      fontWeight: 'bold',
    },
    h4: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    h5: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    h6: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    body2: {
      fontSize: 12,
    },
    subtitle1: {
      fontSize: 16,
      color: palette.primary.main,
    },
  },
  shape: {
    borderRadius: 6,
  },
  overrides: {
    MuiTypography: {
      gutterBottom: { marginBottom: 8 },
    },
    MuiCard: {
      root: {
        padding: 20,
      },
    },
  },
})

const Main = () => {
  return (
    <MUIThemeProvider theme={muiTheme}>
      <ThemeProvider theme={gnosisTheme}>
        <CssBaseline />
        <GlobalStyle />
        <SafeProvider
          loader={
            <Row alignItems="center" justifyContent="center" height="100%">
              <Loader size="md" />
            </Row>
          }
        >
          <App />
        </SafeProvider>
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
