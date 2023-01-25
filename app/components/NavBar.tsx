import LogoutIcon from '@mui/icons-material/Logout'
import { Box, Button, Link, Stack, Typography } from '@mui/material'
import { blueGrey } from '@mui/material/colors'
import RouterLink from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'
import LogoSquareIcon from './icons/LogoSquareIcon'
import theme from '../styles/theme'
import useConfig from '../hooks/useWebConfig'

export interface NavBarItem {
  href: string
  name: string
  external?: boolean
}

interface LinkElementProps {
  href: string
  external?: boolean
  children: JSX.Element
}

const LinkElement = (props: LinkElementProps): JSX.Element => {
  const { href, external, children } = props

  return (external ?? false)
    ? (<Link rel="noreferrer" href={href} target="_blank">{children}</Link>)
    : (<RouterLink href={href}>{children}</RouterLink>)
}

interface NavBarProps {
  items: NavBarItem[]
  onSignOut?: () => void
}

const NavBar = ({ items, onSignOut }: NavBarProps): JSX.Element => {
  const { pathname } = useRouter()
  const config = useConfig()

  const handleLogout = (): void => {
    if (onSignOut !== undefined) {
      onSignOut()
    }
  }

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{ height: '80px' }}
    >
      <Stack direction="row" spacing={8}>
        <RouterLink href="/">
          <Box
            sx={{
              backgroundColor: theme.palette.primary.main,
              borderRadius: '8px',
              transition: 'background-color 150ms',
              width: '48px',
              height: '48px',
              '&:hover': { backgroundColor: '#333' }
            }}
          >
            <LogoSquareIcon sx={{ fontSize: '48px' }} />
          </Box>
        </RouterLink>
      </Stack>
      <Stack direction="row" spacing={2} alignItems="center">
        {items.map(item => {
          const active = item.href === pathname.toLowerCase()

          return (
            <LinkElement key={item.name} href={item.href} external={item.external}>
              <Typography
                variant="h5"
                className={active ? 'active' : ''}
                sx={{
                  fontWeight: 500,
                  color: blueGrey[800],
                  transition: 'color 150ms',
                  '&:hover': { color: '#333' },
                  '&.active': { color: theme.palette.primary.main }
                }}
              >
                {item.name}
              </Typography>
            </LinkElement>
          )
        })}
        { config.features.isEnabled('firebase') && (
            <Button
              variant="text"
              disableElevation
              size="small"
              sx={{
                fontFamily: 'Inter',
                borderRadius: '32px'
              }}
              endIcon={<LogoutIcon fontSize="small" />}
              onClick={handleLogout}
            >
              Logout
            </Button>
        )}
      </Stack>
    </Stack>
  )
}

export default NavBar
