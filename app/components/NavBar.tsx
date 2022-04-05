import {
  Box,
  Button,
  Card,
  Container,
  Stack,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { styled } from '@mui/system';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import theme from '../styles/theme';

const MenuItem = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
  borderRight: '2px solid transparent',
  transition: 'border-right 200ms',
  '&:hover': {
    borderRight: '2px solid ' + grey[900],
  },
});

const MenuCard = styled(Card)({
  position: 'fixed',
  left: '8px',
  top: '8px',
  bottom: '8px',
  background: '#fff',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minWidth: '60px',
  borderRadius: '8px',
  zIndex: 2,
});

export type NavBarItem = {
  icon: React.Node,
  path: string,
  name: string,
}

type NavBarProps = {
  items: NavBarItem[]
}

const NavBar = ({ items }: NavBarProps) => {
  const { pathname } = useRouter();

  return (
    <Stack
      component={MenuCard}
      container
      spacing={1}
      sx={{
        [theme.breakpoints.down('md')]: {
          display: 'none'
        },
      }}
    >
      { items.map(item => {
        const active = item.path === pathname.toLowerCase();

        return (
          <MenuItem key={item.path} className={active ? "active" : ""}>
            <Link href={item.path}>
              <Button className={active ? "active" : ""} sx={{
                borderRadius: '4px',
                minWidth: '0',
                width: '0',
                '&.active': {
                  background: grey[900],
                  color: 'white',
                },
              }}>
                <item.icon sx={{
                  color: active ? 'white' : grey[500],
                }} />
              </Button>
            </Link>
          </MenuItem>
        );
      }) }
    </Stack>
  );
};

export default NavBar;
