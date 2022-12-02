import { Alert, Box, Container, Stack } from '@mui/material'
import React from 'react'

const InfoMessage = (props: any): JSX.Element => {
  return (
    <Box sx={props.sx}>
      <Container>
        <Alert severity="info">
          <Stack direction="row" spacing={1} alignItems="center">
            {props.children}
          </Stack>
        </Alert>
      </Container>
    </Box>
  )
}

export default InfoMessage
