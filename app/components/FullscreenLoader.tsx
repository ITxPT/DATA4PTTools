import { Backdrop, CircularProgress } from '@mui/material'
import type { Theme } from '@mui/material/styles'
import React from 'react'

export interface BackdropProps {
  open: boolean
}

const FullscreenLoader = ({ open }: BackdropProps): JSX.Element => {
  return (
    <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme: Theme) => theme.zIndex.drawer + 1
        }}
        open={open}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
  )
}

export default FullscreenLoader
