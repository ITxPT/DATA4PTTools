import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import React from 'react'
import type { Session } from '../../../api/types'
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

  const processRequest = (req: Promise<Session>, cb?: (session: Session | null) => void): void => {
    setLoading(true)
    req.then(session => {
      setErrorMessage('')
      if (cb != undefined) {
        cb(session)
      }
    }).catch(err => {
      setErrorMessage(err.message)
      if (cb != undefined) {
        cb(null)
      }
    }).finally(() => {
      setLoading(false)
    })
  }

  const handleValidateAnother = (): void => {
    processRequest(apiClient.createSession(), newSession => {
      if (session?.profile != undefined) {
        processRequest(apiClient.setProfile(newSession?.id ?? '', session.profile), async () => {
          await router.push(`/jobs/${newSession?.id ?? ''}/files`)
        })
      }
    })
  }

  React.useEffect(() => {
    const id = router.query.id ?? ''

    if (id === '') {
      return
    }

    setLoading(true)

    processRequest(apiClient.session(id as string), session => {
      setSession(session)
    })
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

      {loading
        ? <FullscreenLoader open={loading} />
        : <ValidationResult session={session as any} onValidateAnother={handleValidateAnother} />
      }

    </App>
  )
}

export default Result
