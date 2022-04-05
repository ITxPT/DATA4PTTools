import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import { Box, Container, Grid, SpeedDial, SpeedDialAction } from '@mui/material';
import { useRouter } from 'next/router';
import React from 'react';
import { NavBarItem } from './NavBar';
import theme from '../styles/theme';

type NavDialProps = {
  items: NavBarItem[];
}

const NavDial = ({ items }: NavDialProps) => {
  const [open, setOpen] = React.useState<bool>(false);
  const router = useRouter();

  const handleOpen = () => {
    setOpen(true);
  };

  const handleActionClick = (path: string) => {
    return () => {
      setOpen(false);
      router.push(path);
    }
  };

  return (
    <SpeedDial
      ariaLabel="App links"
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
      }}
      icon={<MenuRoundedIcon />}
    >
      {
        items.map(item => {
          const active = item.path === router.pathname.toLowerCase();

          return (
            <SpeedDialAction
              className={active ? "active" : ""}
              key={item.name}
              icon={<item.icon />}
              tooltipTitle={item.name}
              onClick={handleActionClick(item.path)}
            />
          );
        })
      }
    </SpeedDial>
  );
};

export default NavDial;
