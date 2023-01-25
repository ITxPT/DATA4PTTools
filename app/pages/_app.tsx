import { Container, Link, Stack } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { FirebaseOptions } from 'firebase/app'
import { AppProps } from 'next/app'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'
import Auth from '../components/Auth'
import Footer from '../components/Footer'
import NavBar from '../components/NavBar'
import FullscreenLoader from '../components/FullscreenLoader'
import InfoMessage from '../components/InfoMessage'
import { useApp, useAuth } from '../hooks/useFirebase'
import useEmail from '../hooks/useEmail'
import useConfig from '../hooks/useWebConfig'
import theme from '../styles/theme'
import '../styles/globals.css'

const menuItems = [{
  href: '/jobs',
  name: 'Validations'
}, {
  href: 'https://github.com/ITxPT/DATA4PTTools',
  name: 'GitHub'
}]

type FirebaseAppProps = {
  firebaseOpts: FirebaseOptions
} & AppProps

const FirebaseApp = (props: FirebaseAppProps): any => {
  const router = useRouter()
  const { email, setEmail } = useEmail()
  const app = useApp(props.firebaseOpts)
  const {
    user,
    loading,
    isSignInWithEmailLink,
    sendSignInLinkToEmail,
    signInWithEmailLink,
    signOut
  } = useAuth(app)
  const isSignIn = user === null && isSignInWithEmailLink(router.asPath)
  const [isLoading, setIsLoading] = React.useState<boolean>(true)

  const handleSignIn = (email: string): void => {
    const origin =
    typeof window !== 'undefined' && window.location.origin !== ''
      ? window.location.origin
      : ''

    // TODO provide feedback to user
    sendSignInLinkToEmail(email, origin).then(() => {
      setEmail(email)
    }).catch((error) => {
      console.log('error', error.code, error.message)
    })
  }

  const handleSignOut = (): void => {
    setIsLoading(true)

    signOut()
      .catch(err => console.log(err))
      .finally(() => setIsLoading(false))
  }

  React.useEffect(() => {
    setIsLoading(loading)
  }, [loading])

  if (isLoading || isSignIn) {
    // TODO maybe place a splash screen for "signing in"
    if (isSignIn) {
      signInWithEmailLink(email, router.asPath).then(async () => {
        await router.replace(router.pathname, undefined, { shallow: true })
      }).catch(err => {
        console.log(err) // TODO
      })
    }

    return (
      <FullscreenLoader open={isLoading} />
    )
  } else if (user === null) {
    return (
      <Auth onSubmit={handleSignIn} />
    )
  }

  return <DefaultApp onSignOut={handleSignOut} {...props} />
}

type DefaultAppProps = {
  onSignOut?: () => void
} & AppProps

const DefaultApp = ({
  Component,
  pageProps,
  onSignOut
}: DefaultAppProps): JSX.Element => {
  return (
    <Stack spacing={8}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <NavBar items={menuItems} onSignOut={onSignOut} />
          <InfoMessage>
            <span>Note that this is an early build and more capabilities will be available soon. Visit us regularly for updated!
              You may provide your feedback in <Link underline="hover" href="https://forms.gle/eRfRYeFs2D7JhmPRA" target="_blank" rel="noreferrer">this form</Link></span>
          </InfoMessage>
          <Component {...pageProps} />
        </Stack>
      </Container>
      <Footer />
    </Stack>
  )
}

const App = (props: AppProps): any => {
  const config = useConfig()

  return (
    <React.Fragment>
      <Head>
        <title>NeTEx validation | Greenlight</title>
        <meta name="description" content="Fast and simple NeTEx validation" />
      </Head>

      <ThemeProvider theme={theme}>
        { config.features.isEnabled('firebase')
          ? <FirebaseApp firebaseOpts={config.firebase} {...props} />
          : <DefaultApp {...props} />
        }
      </ThemeProvider>
    </React.Fragment>
  )
}

export default App
