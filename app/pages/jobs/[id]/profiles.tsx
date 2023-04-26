import { Stack, Typography } from '@mui/material'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import React from 'react'
import type { Profile, Session } from '../../../api/types'
import App from '../../../components/App'
import ErrorAlert from '../../../components/ErrorAlert'
import FullscreenLoader from '../../../components/FullscreenLoader'
import JobStatus from '../../../components/JobStatus'
import ProfileCard from '../../../components/ProfileCard'
import ValidationStepper from '../../../components/ValidationStepper'
import useApiClient from '../../../hooks/useApiClient'
import profileOptions from '../../../public/profiles.json'
import scriptOptions from '../../../public/scripts.json'

const profiles = profileOptions.map(v => ({
  ...v,
  scripts: v.scripts.map(s => ({
    ...scriptOptions.find((v) => v.name === s.name),
    ...s
  }))
})) as Profile[]

const Profiles: NextPage = () => {
  const [session, setSession] = React.useState<Session | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string>('')
  const [errorOpen, setErrorOpen] = React.useState<boolean>(false)
  const [loading, setLoading] = React.useState<boolean>(true)
  const [disabled, setDisabled] = React.useState<boolean>(false)
  const router = useRouter()
  const apiClient = useApiClient()

  const handleNewValidationClick = (): void => {
    apiClient.createSession()
      .then(async (session) => {
        await router.push('/jobs/' + session.id)
      })
      .catch(err => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const processRequest = (req: Promise<Session>, cb?: () => any): void => {
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
    setDisabled(session?.status !== 'created')
  }, [session, setDisabled])

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
        <JobStatus session={session} onValidate={handleNewValidationClick} />
        <Typography variant="h3">Select configuration</Typography>
        <Stack spacing={1}>
          {profiles.map(profile => (
            <ProfileCard
              disabled={disabled}
              key={profile.name}
              profile={profile}
              onSelect={handleNext}
            />
          ))}
        </Stack>
      </Stack>

      <FullscreenLoader open={loading} />
    </App>
  )
}

export default Profiles
