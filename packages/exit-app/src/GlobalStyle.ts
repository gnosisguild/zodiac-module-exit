import { createGlobalStyle } from 'styled-components'
import avertaFont from '@gnosis.pm/safe-react-components/dist/fonts/averta-normal.woff2'
import avertaBoldFont from '@gnosis.pm/safe-react-components/dist/fonts/averta-bold.woff2'

import RobotoMonoRegularWoff from './assets/fonts/RobotoMono/roboto-mono-v13-latin-regular.woff2'
import RobotoMonoRegularWoff2 from './assets/fonts/RobotoMono/roboto-mono-v13-latin-regular.woff'

import SpectralRegularWoff from './assets/fonts/Spectral/spectral-v7-latin-regular.woff'
import SpectralRegularWoff2 from './assets/fonts/Spectral/spectral-v7-latin-regular.woff2'

const GlobalStyle = createGlobalStyle`
    html {
        height: 100%
    }

    body {
       height: 100%;
       margin: 0px;
       padding: 0px;
    }

    #root {
        height: 100%;
        padding-right: 0.5rem;
    }

    .MuiFormControl-root,
    .MuiInputBase-root {
        width: 100% !important;
    }

    @font-face {
        font-family: 'Averta';
        src: local('Averta'), local('Averta Bold'),
        url(${avertaFont}) format('woff2'),
        url(${avertaBoldFont}) format('woff');
    }
    
    @font-face {
      font-family: 'Roboto Mono';
      font-style: normal;
      font-weight: 400;
      src: local(''),
      url(${RobotoMonoRegularWoff}) format('woff2'),
      url(${RobotoMonoRegularWoff2}) format('woff');
    }

    /* spectral-regular - latin */
    @font-face {
      font-family: 'Spectral';
      font-style: normal;
      font-weight: 400;
      src: local(''),
      url(${SpectralRegularWoff2}) format('woff2'),
      url(${SpectralRegularWoff}) format('woff');
    }
`

export default GlobalStyle
