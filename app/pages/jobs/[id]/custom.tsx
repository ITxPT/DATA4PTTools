import { Stack, Typography } from '@mui/material'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import React from 'react'
import { Profile, Session } from '../../../api/types'
import App from '../../../components/App'
import CustomConfiguration from '../../../components/CustomConfiguration'
import ErrorAlert from '../../../components/ErrorAlert'
import FullscreenLoader from '../../../components/FullscreenLoader'
import ValidationStepper from '../../../components/ValidationStepper'
import useApiClient from '../../../hooks/useApiClient'

const Custom: NextPage = () => {
  const [session, setSession] = React.useState<Session | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string>('')
  const [errorOpen, setErrorOpen] = React.useState<boolean>(false)
  const [loading, setLoading] = React.useState<boolean>(true)
  const router = useRouter()
  const apiClient = useApiClient()

  const processRequest = (req: Promise<Session>, cb?: Function): void => {
    setLoading(true)

    req.then(session => {
      setErrorMessage('')
      setSession(session)
    }).catch(err => {
      setSession(null)
      setErrorMessage(err.message)
    }).finally(() => {
      setLoading(false)

      if (cb != null) {
        cb()
      }
    })
  }

  const handleNext = (profile: Profile): void => {
    processRequest(apiClient.setProfile(session?.id ?? '', profile), async () => {
      await router.push(`/jobs/${session?.id ?? ''}/files`)
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
        onClose={() => setErrorOpen(false)}
      />

      <Stack spacing={4}>
        <ValidationStepper step={0} />
        <Typography variant="h4">Custom configuration</Typography>
        <CustomConfiguration onNext={handleNext} />
      </Stack>

      <FullscreenLoader open={loading} />
    </App>
  )
}

export default Custom
