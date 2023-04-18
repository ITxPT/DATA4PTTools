import {
  Divider,
  Stack,
  Typography
} from '@mui/material'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import React from 'react'
import type { Session } from '../../api/types'
import App from '../../components/App'
import CardButton from '../../components/CardButton'
import ErrorAlert from '../../components/ErrorAlert'
import FullscreenLoader from '../../components/FullscreenLoader'
import ValidationStepper from '../../components/ValidationStepper'
import useApiClient from '../../hooks/useApiClient'

const Job: NextPage = () => {
  const [session, setSession] = React.useState<Session | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string>('')
  const [errorOpen, setErrorOpen] = React.useState<boolean>(false)
  const [loading, setLoading] = React.useState<boolean>(true)
  const router = useRouter()
  const apiClient = useApiClient()

  const processRequest = (req: Promise<Session>): void => {
    setLoading(true)

    req.then(session => {
      setErrorMessage('')
      setSession(session)
    }).catch(err => {
      setSession(null)
      setErrorMessage(err.message)
    }).finally(() => {
      setLoading(false)
    })
  }

  React.useEffect(() => {
    const id = router.query.id ?? ''

    if (id === '') {
      return
    }

    processRequest(apiClient.session(id as string))
  }, [apiClient, router.query])

  return (
    <App authRequired>
      <ErrorAlert
        open={errorOpen}
        message={errorMessage}
        onClose={() => {
          setErrorOpen(false)
        }}
      />

      <Stack spacing={4}>
        <ValidationStepper step={0} />
        <Typography variant="h3">Configuration</Typography>
        <Stack spacing={2}>
          <a href={`/jobs/${session?.id ?? ''}/profiles`}>
            <CardButton onClick={() => { setLoading(true) }}>
              <Stack spacing={1}>
                <Typography variant="h4">Packages</Typography>
                <Typography variant="body1">Select from a list of predefined packages of NeTEx profiles and rules</Typography>
              </Stack>
            </CardButton>
          </a>
          <Divider>
            <Typography variant="caption">OR</Typography>
          </Divider>
          <a href={`/jobs/${session?.id ?? ''}/custom`}>
            <CardButton onClick={() => { setLoading(true) }}>
              <Stack spacing={1}>
                <Typography variant="h4">Custom</Typography>
                <Typography variant="body1">Create your own custom configuration</Typography>
              </Stack>
            </CardButton>
          </a>
        </Stack>
      </Stack>

      <FullscreenLoader open={loading} />
    </App>
  )
}

export default Job
