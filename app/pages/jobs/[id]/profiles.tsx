import { Stack, Typography } from '@mui/material'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import React from 'react'
import { Profile, Session } from '../../../api/types'
import ErrorAlert from '../../../components/ErrorAlert'
import FullscreenLoader from '../../../components/FullscreenLoader'
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
    <React.Fragment>
      <ErrorAlert
        open={errorOpen}
        message={errorMessage}
        onClose={() => setErrorOpen(false)}
      />

      <Stack spacing={4}>
        <ValidationStepper step={0} />
        <Typography variant="h3">Select profile</Typography>
        <Stack spacing={1}>
          { profiles.map(profile => (
              <ProfileCard
                key={profile.name}
                profile={profile}
                onSelect={handleNext}
              />
          )) }
        </Stack>
      </Stack>

      <FullscreenLoader open={loading} />
    </React.Fragment>
  )
}

export default Profiles
