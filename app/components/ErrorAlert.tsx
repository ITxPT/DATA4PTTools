import { Alert, Snackbar } from '@mui/material'
import React from 'react'

export interface ErrorAlertProps {
  message: string
  open: boolean
  onClose: () => void
}

const ErrorAlert = (props: ErrorAlertProps): JSX.Element => {
  const { message, open, onClose } = props

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert severity="error" onClose={onClose}>{message}</Alert>
    </Snackbar>
  )
}

export default ErrorAlert
