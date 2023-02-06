import React from 'react'
import Layout from '../components/Layout'
import FirebaseApp from '../components/FirebaseApp'
import FullscreenLoader from '../components/FullscreenLoader'
import useConfig from '../hooks/useWebConfig'

interface AppProps {
  authRequired?: boolean
  onSignOut?: () => void
  children: JSX.Element | JSX.Element[]
}

const App = ({ authRequired = false, children }: AppProps): JSX.Element => {
  const { config, loading } = useConfig()

  if (loading) {
    return <FullscreenLoader open={loading} />
  }

  return (
    authRequired && config.features.isEnabled('firebase')
      ? <FirebaseApp firebaseOpts={config.firebase}>{children}</FirebaseApp>
      : <Layout>{children}</Layout>
  )
}

export default App
