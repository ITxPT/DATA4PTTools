import { ThemeProvider } from '@mui/material/styles'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import React from 'react'
import theme from '../styles/theme'
import '../styles/globals.css'
import useConfig from '../hooks/useWebConfig'

const App = (props: AppProps): any => {
  const { Component } = props

  useConfig()

  return (
    <>
      <Head>
        <title>NeTEx validation | Greenlight</title>
        <meta name="description" content="Fast and simple NeTEx validation" />
      </Head>

      <ThemeProvider theme={theme}>
        <Component {...props} />
      </ThemeProvider>
    </>
  )
}

export default App
