import { Alert, Stack } from '@mui/material'
import React from 'react'

const InfoMessage = (props: any): JSX.Element => {
  return (
    <Alert severity="info">
      <Stack direction="row" spacing={1} alignItems="center">
        {props.children}
      </Stack>
      </Alert>
  )
}

export default InfoMessage
