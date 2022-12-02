import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import { SpeedDial, SpeedDialAction } from '@mui/material'
import { useRouter } from 'next/router'
import React from 'react'
import { NavBarItem } from './NavBar'

interface NavDialProps {
  items: NavBarItem[]
}

const NavDial = ({ items }: NavDialProps): JSX.Element => {
  const router = useRouter()

  const handleActionClick = (path: string): Function => {
    return async () => {
      await router.push(path)
    }
  }

  return (
    <SpeedDial
      ariaLabel="App links"
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16
      }}
      icon={<MenuRoundedIcon />}
    >
      {
        items.map(item => {
          const active = item.path === router.pathname.toLowerCase()

          return (
            <SpeedDialAction
              className={active ? 'active' : ''}
              key={item.name}
              icon={<item.icon />}
              tooltipTitle={item.name}
              onClick={() => handleActionClick(item.path)()}
            />
          )
        })
      }
    </SpeedDial>
  )
}

export default NavDial
