import { NextPage } from 'next'
import { useRouter } from 'next/router'
import React from 'react'
import { Session } from '../../../api/types'
import ErrorAlert from '../../../components/ErrorAlert'
import FullscreenLoader from '../../../components/FullscreenLoader'
import MainContent from '../../../components/MainContent'
import ValidationResult from '../../../components/ValidationResult'
import useApiClient from '../../../hooks/useApiClient'

const Result: NextPage = () => {
  const [session, setSession] = React.useState<Session | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string>('')
  const [errorOpen, setErrorOpen] = React.useState<boolean>(false)
  const [loading, setLoading] = React.useState<boolean>(true)
  const router = useRouter()
  const apiClient = useApiClient()

  React.useEffect(() => {
    const id = router.query.id ?? ''

    if (id === '') {
      return
    }

    setLoading(true)

    apiClient.session(id as string).then(session => {
      setErrorMessage('')
      setSession(session)
    }).catch(err => {
      setSession(null)
      setErrorMessage(err.message)
    }).finally(() => setLoading(false))
  }, [apiClient, router.query])

  return (
    <React.Fragment>
      <ErrorAlert
        open={errorOpen}
        message={errorMessage}
        onClose={() => setErrorOpen(false)}
      />

      <MainContent>
        { !loading && (
          <ValidationResult session={session as any} />
        ) }

        <FullscreenLoader open={loading} />
      </MainContent>
    </React.Fragment>
  )
}

export default Result
