import { Box, Divider, Stack, Typography } from '@mui/material'
import { blue } from '@mui/material/colors'
import React from 'react'
import CardButton from './CardButton'
import type { Profile, Script } from '../api/types'

export interface ProfileScriptTableProps {
  scripts: Script[]
}

const ProfileScriptTable = (props: ProfileScriptTableProps): JSX.Element => {
  const { scripts } = props

  return (
    <>
      <Typography
        sx={{ paddingTop: '10px' }}
        variant="caption"
        color="text.secondary"
      >
        INCLUDED SCRIPTS
      </Typography>

      <Box>
      {
        scripts.map(script => (
          <Stack
            direction="row"
            key={script.name}
            spacing={1}
          >
            <Stack alignItems="center">
              <Box sx={{ width: '2px', height: 'calc(50% - 6px)', backgroundColor: blue[200] }}></Box>
              <Box sx={{ width: '12px', height: '12px', borderRadius: '8px', border: `2px solid ${blue[200]}` }}></Box>
              <Box sx={{ width: '2px', height: 'calc(50% - 6px)', backgroundColor: blue[200] }}></Box>
            </Stack>
            <Stack spacing={1} sx={{ padding: 1 }}>
              <Stack spacing={1} direction="row" alignItems="center">
                <Typography variant="caption">{script.name}</Typography>
                { script.description !== '' && (
                  <>
                    <Divider orientation="vertical" />
                    <Typography variant="caption" color="text.secondary">{script.description}</Typography>
                  </>
                )}
                <Typography variant="caption" color="secondary">{`v${script.version}`}</Typography>
              </Stack>
            </Stack>
          </Stack>
        ))
      }
      </Box>
    </>
  )
}

export interface ProfileCardProps {
  onSelect: (profile: Profile) => void
  profile: Profile
}

const ProfileCard = (props: ProfileCardProps): JSX.Element => {
  const { name, description, version, scripts } = props.profile

  const onClick = (): void => {
    props.onSelect(props.profile)
  }

  return (
    <CardButton onClick={onClick}>
      <Stack spacing={1}>
        <Stack sx={{ position: 'relative' }} direction="row" justifyContent="space-between" alignItems="center">
          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography sx={{ fontSize: 12 }} color="text.secondary">{name}</Typography>
              <Typography variant="caption" color="secondary">{`v${version ?? ''}`}</Typography>
            </Stack>
            <Typography variant="h5">
              {description}
            </Typography>
            { scripts.length > 0 && (<ProfileScriptTable scripts={scripts} />) }
          </Stack>
        </Stack>
      </Stack>
    </CardButton>
  )
}

export default ProfileCard
