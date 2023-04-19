import LogoutIcon from '@mui/icons-material/Logout'
import { Box, Button, Link, Stack, Typography } from '@mui/material'
import { blueGrey } from '@mui/material/colors'
import RouterLink from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'
import LogoSquareIcon from './icons/LogoSquareIcon'
import useApiClient from '../hooks/useApiClient'
import theme from '../styles/theme'

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
  const router = useRouter()
  const apiClient = useApiClient()
  const [loading, setLoading] = React.useState<boolean>(false)
  const [errorMessage, setErrorMessage] = React.useState<string>('')

  const handleNewValidation = (): void => {
    setLoading(true)

    apiClient.createSession()
      .then(async (session) => {
        await router.push('/jobs/' + session.id)
      })
      .catch(err => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setLoading(false)

        setTimeout(() => {
          setErrorMessage('')
        }, 3000)
      })
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
          const active = item.href === router.pathname.toLowerCase()

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
        <Button
          variant="contained"
          disableElevation
          size="small"
          sx={{
            fontFamily: 'Inter',
            borderRadius: '32px'
          }}
          disabled={loading}
          onClick={handleNewValidation}
          color={errorMessage !== '' ? 'error' : 'primary'}
        >
          {errorMessage !== ''
            ? errorMessage
            : (loading ? 'Creating...' : 'New validation')
          }
        </Button>
        {onSignOut !== undefined && (
          <Button
            variant="text"
            disableElevation
            size="small"
            sx={{
              fontFamily: 'Inter',
              borderRadius: '32px'
            }}
            endIcon={<LogoutIcon fontSize="small" />}
            onClick={onSignOut}
          >
            Logout
          </Button>
        )}
      </Stack>
    </Stack>
  )
}

export default NavBar
