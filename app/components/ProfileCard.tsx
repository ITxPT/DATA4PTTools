import {
  Chip,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
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
        INCLUDED RULES
      </Typography>

      <Stack direction="row" flexWrap="wrap" gap="4px" maxWidth={'100%'}>
        {
          scripts.map(script => (
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
    </>
  )
}

export interface ProfileCardProps {
  onSelect: (profile: Profile) => void
  profile: Profile
  disabled?: boolean
}

const ProfileCard = (props: ProfileCardProps): JSX.Element => {
  const { name, description, version, scripts } = props.profile

  const onClick = (): void => {
    props.onSelect(props.profile)
  }

  return (
    <CardButton onClick={onClick} disabled={props.disabled}>
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
