import EmailIcon from '@mui/icons-material/Email'
import GitHubIcon from '@mui/icons-material/GitHub'
import { Box, IconButton, Stack } from '@mui/material'
import Link from 'next/link'
import React from 'react'
import DockerIcon from './icons/DockerIcon'

const BugReport = (): JSX.Element => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: '10px',
        right: '10px'
      }}
    >
      <Stack>
        <a href="https://github.com/ITxPT/DATA4PTTools" target="_blank" rel="noreferrer">
          <IconButton color="primary">
            <GitHubIcon />
          </IconButton>
        </a>
        <a href="https://hub.docker.com/r/lekojson/greenlight" target="_blank" rel="noreferrer">
          <IconButton color="primary">
            <DockerIcon />
          </IconButton>
        </a>
        <Link href="mailto:anastasia.founta@itxpt.org;jesper.j.tornros@concreteit.se;petter.kvarnfors@concreteit.se">
          <IconButton color="primary">
            <EmailIcon />
          </IconButton>
        </Link>
      </Stack>
    </Box>
  )
}

export default BugReport
