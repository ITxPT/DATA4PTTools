import { Alert, AlertTitle } from '@mui/material'
import Link from 'next/link'
import React from 'react'
import type { Session } from '../api/types'

interface JobStatusProps {
  session: Session | null
  onValidate?: () => void
}

const JobStatus = ({
  session,
  onValidate
}: JobStatusProps): JSX.Element => {
  const handleClick = (): void => {
    if (onValidate !== undefined) {
      onValidate()
    }
  }

  if (session === null || session.status === 'created') {
    return (
      <></>
    )
  }

  const text = session.status === 'running'
    ? 'Validation is already running, '
    : 'Validation has already been processed, '
  const linkText = session.status === 'running'
    ? 'check out the progress'
    : 'check out the result'

  return (
    <Alert severity="warning">
      <AlertTitle>Hold up!</AlertTitle>
      {text}
      <Link href={`/jobs/${session.id}/result`}>
        <span style={{ textDecoration: 'underline', fontWeight: 500 }}>{linkText}</span>
      </Link>
      { onValidate !== undefined && (
        <>
          {' '}or{' '}
          <span
            style={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: 500 }}
            onClick={() => { handleClick() }}
          >validate more</span>
        </>
      )}
    </Alert>
  )
}

export default JobStatus
