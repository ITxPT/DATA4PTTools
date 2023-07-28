import { Chip, Stack, Tooltip, Typography } from '@mui/material'
import React from 'react'
import type { Session } from '../api/types'

export interface ConfigurationInfoProps {
  session: Session
}

const ConfigurationInfo = ({
  session
}: ConfigurationInfoProps): JSX.Element => {
  return (
    <Stack
      gap={2}
      sx={{
        background: '#fff',
        padding: 2,
        border: '1px solid #e0e0e0',
        borderRadius: 2
      }}
    >
      <Typography variant="h5">{session.profile?.description}</Typography>
      <Stack direction="row" flexWrap="wrap" gap="4px" maxWidth={'100%'}>
        {
          session.profile?.scripts.map(script => (
            <Tooltip
              placement="top"
              key={script.name}
              title={script.longDescription}
              disableInteractive
            >
              <Chip
                size="small"
                label={script.description}
              />
            </Tooltip>
          ))
        }
      </Stack>
    </Stack>
  )
}

export default ConfigurationInfo
