import { NextPage } from 'next'
import { useRouter } from 'next/router'
import React from 'react'
import { Session } from '../../../api/types'
import App from '../../../components/App'
import ErrorAlert from '../../../components/ErrorAlert'
import FullscreenLoader from '../../../components/FullscreenLoader'
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
    <App authRequired>
      <ErrorAlert
        open={errorOpen}
        message={errorMessage}
        onClose={() => setErrorOpen(false)}
      />

      { loading
        ? <FullscreenLoader open={loading} />
        : <ValidationResult session={session as any} />
      }

    </App>
  )
}

export default Result
