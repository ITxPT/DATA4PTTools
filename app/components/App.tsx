import React from 'react'
import Layout from '../components/Layout'
import FirebaseApp from '../components/FirebaseApp'
import FullscreenLoader from '../components/FullscreenLoader'
import useConfig from '../hooks/useWebConfig'
import Script from 'next/script'

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
    <>
      {config.features.isEnabled('gtag') && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${config.gtagId}`}
            strategy="afterInteractive"
            async
          />
          <Script id="google-analytics" strategy="afterInteractive" async>
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${config.gtagId}');
          `}
          </Script>
        </>
      )}
      {authRequired && config.features.isEnabled('firebase')
        ? <FirebaseApp firebaseOpts={config.firebase}>{children}</FirebaseApp>
        : <Layout>{children}</Layout>}
    </>
  )
}

export default App
