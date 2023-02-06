import { Container, Stack, Typography } from '@mui/material'
import { type NextPage } from 'next'
import Head from 'next/head'
import React from 'react'
import App from '../components/App'

const Policy: NextPage = () => {
  return (
    <App>
      <Head>
        <title>Privacy policy | Greenlight</title>
        <meta name="description" content="Fast and simple NeTEx validation" />
      </Head>

      <Container>
        <Stack spacing={4}>
          <Typography variant="h1">Privacy Policy</Typography>
          <Stack spacing={2}>
            <Typography variant="h4">Information Technology for Public Transportation a.i.s.b.l</Typography>
            <Typography>
              Information Technology for Public Transport a.i.s.b.l. (hereinafter referred to as ITxPT) is a non-profit organization whose mission is to specify communication protocols and hardware interfaces to offer a full interoperability of IT systems in Public Transport applications.
              We are committed to protecting the privacy of our members and users. This privacy policy seeks to help you understand why and how we use your personal information. We value your privacy and strive to protect your personal information. Please read this Policy to understand what types of information we collect from you, for what purposes and what choices you have regarding our collection of your information.
              This policy covers ITxPT.org website and all *.itxpt.org subsites (collectively, the “Website”)
            </Typography>
            <Typography>By accessing, using or posting information to this Website, you agree to this Privacy Policy and the Terms of Use.</Typography>
          </Stack>
        </Stack>
      </Container>
    </App>
  )
}

export default Policy
