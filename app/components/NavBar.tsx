import { Box, Button, Card, Stack } from '@mui/material'
import { grey } from '@mui/material/colors'
import { styled } from '@mui/system'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'
import theme from '../styles/theme'

const MenuItem = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
  borderRight: '2px solid transparent',
  transition: 'border-right 200ms',
  '&:hover': {
    borderRight: '2px solid ' + grey[900]
  }
})

const MenuCard = styled(Card)({
  position: 'fixed',
  left: 0,
  top: 0,
  bottom: 0,
  background: '#fff',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minWidth: '60px',
  zIndex: 2
})

export interface NavBarItem {
  icon: any
  path: string
  name: string
}

interface NavBarProps {
  items: NavBarItem[]
}

const NavBar = ({ items }: NavBarProps): JSX.Element => {
  const { pathname } = useRouter()

  return (
    <Stack
      component={MenuCard}
      spacing={1}
      sx={{
        [theme.breakpoints.down('md')]: { display: 'none' },
        boxShadow: 0
      }}
    >
      { items.map(item => {
        const active = item.path === pathname.toLowerCase()

        return (
          <MenuItem key={item.path} className={active ? 'active' : ''}>
            <Link href={item.path} style={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                className={active ? 'active' : ''}
                sx={{
                  borderRadius: '4px',
                  minWidth: '0',
                  width: '0',
                  '&.active': {
                    background: grey[900],
                    color: 'white'
                  }
                }}
              >
                <item.icon sx={{ color: active ? 'white' : grey[500] }} />
              </Button>
            </Link>
          </MenuItem>
        )
      }) }
    </Stack>
  )
}

export default NavBar
