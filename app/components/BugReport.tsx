import EmailIcon from '@mui/icons-material/Email';
import GitHubIcon from '@mui/icons-material/GitHub';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Box, IconButton, Stack } from '@mui/material';
import Link from 'next/link';
import React from 'react';
import DockerIcon from './icons/DockerIcon';
import theme from '../styles/theme';

const BugReport = () => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: '10px',
        right: '10px',
      }}
    >
      <Stack>
        <Link href="https://github.com/ITxPT/DATA4PTTools">
          <a target="_blank">
            <IconButton color="primary">
              <GitHubIcon />
            </IconButton>
          </a>
        </Link>
        <Link href="https://hub.docker.com/r/lekojson/greenlight">
          <a target="_blank">
            <IconButton color="primary">
              <DockerIcon />
            </IconButton>
          </a>
        </Link>
        <Link passHref href="mailto:anastasia.founta@itxpt.org;jesper.j.tornros@concreteit.se;petter.kvarnfors@concreteit.se">
          <IconButton color="primary">
            <EmailIcon />
          </IconButton>
        </Link>
      </Stack>
    </Box>
  );
};

export default BugReport;
