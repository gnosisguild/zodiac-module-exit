import { createGlobalStyle } from 'styled-components'

import avertaFont from '@gnosis.pm/safe-react-components/dist/fonts/averta-normal.woff2'
import avertaBoldFont from '@gnosis.pm/safe-react-components/dist/fonts/averta-bold.woff2'

import MonacoFont from '../assets/fonts/Monaco.woff'

import RobotoMonoRegularWoff from '../assets/fonts/RobotoMono/roboto-mono-v13-latin-regular.woff2'
import RobotoMonoRegularWoff2 from '../assets/fonts/RobotoMono/roboto-mono-v13-latin-regular.woff'

import SpectralRegularWoff from '../assets/fonts/Spectral/spectral-v7-latin-regular.woff'
import SpectralRegularWoff2 from '../assets/fonts/Spectral/spectral-v7-latin-regular.woff2'

export const ZodiacStyle = createGlobalStyle`
    html {
        height: 100%
    }

    body {
       height: 100%;
       margin: 0px;
       padding: 0px;
    }

    /* Works on Firefox*/
    * {
      scrollbar-width: thin;
      scrollbar-color: rgba(217, 212, 173, 0.6) rgba(217, 212, 173, 0.1);
    }

    /* Works on Chrome, Edge, and Safari */
    *::-webkit-scrollbar {
      width: 6px;
    }

    *::-webkit-scrollbar-track {
      background: none;
    }

    *::-webkit-scrollbar-thumb {
      background-color: rgba(217, 212, 173, 0.3);
      border-radius: 0px;
    }

    #root {
        height: 100%;
    }

    .MuiFormControl-root,
    .MuiInputBase-root {
        width: 100% !important;
    }
    
    aside.bn-onboard-custom {
      z-index: 2;
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
    

    @font-face {
        font-family: 'Monaco';
        src: local('Monaco'), url(${MonacoFont}) format('woff');
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
