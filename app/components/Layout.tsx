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
            <span>Note that this is an early build and more capabilities will be available soon. Visit us regularly for updated!
              You may provide your feedback in <Link underline="hover" href="https://forms.gle/eRfRYeFs2D7JhmPRA" target="_blank" rel="noreferrer">this form</Link></span>
          </InfoMessage>
          {children}
        </Stack>
      </Container>
      <Footer />
    </Stack>
  )
}

export default Layout
