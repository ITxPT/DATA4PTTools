import { ThemeProvider } from '@mui/material/styles'
import { AppProps } from 'next/app'
import Head from 'next/head'
import React from 'react'
import theme from '../styles/theme'
import '../styles/globals.css'

const App = (props: AppProps): any => {
  const { Component } = props

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
