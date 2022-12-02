import { Box, Container } from '@mui/material'
import React, { ReactNode } from 'react'
import theme from '../styles/theme'

interface MainContentProps {
  children: ReactNode
}

const MainContent = ({ children }: MainContentProps): JSX.Element => {
  return (
    <Box sx={{
      paddingLeft: '80px',
      paddingTop: '50px',
      [theme.breakpoints.down('md')]: {
        paddingLeft: '0',
        paddingTop: '20px'
      }
    }}>
      <Container maxWidth="lg">{children}</Container>
    </Box>
  )
}

export default MainContent
