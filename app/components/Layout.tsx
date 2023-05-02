import { Container, Link, Stack } from '@mui/material'
import React from 'react'
import Footer from './Footer'
import NavBar from './NavBar'
import InfoMessage from './InfoMessage'

const menuItems = [{
  href: '/jobs',
  name: 'Validations'
}, {
  href: 'https://github.com/ITxPT/DATA4PTTools',
  name: 'GitHub'
}]

interface LayoutProps {
  children: JSX.Element | JSX.Element[]
  onSignOut?: () => void
}

const Layout = ({ children, onSignOut }: LayoutProps): JSX.Element => {
  return (
    <Stack spacing={8}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <NavBar items={menuItems} onSignOut={onSignOut} />
          <InfoMessage>
            <span>Using the online version may apply limitations. For regular use, download and install the tool for free from  <Link underline="hover" href="https://hub.docker.com/r/itxpt/greenlight" target="_blank" rel="noreferrer">Docker</Link> or <Link underline="hover" href="https://github.com/ITxPT/DATA4PTTools" target="_blank" rel="noreferrer">GitHub</Link>. You can read more about requirements <Link href="https://github.com/ITxPT/DATA4PTTools/tree/develop#requirements" target="_blank" rel="noreferrer">here</Link>.</span>
          </InfoMessage>
          {children}
        </Stack>
      </Container>
      <Footer />
    </Stack>
  )
}

export default Layout
