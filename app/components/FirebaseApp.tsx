import { FirebaseOptions } from 'firebase/app'
import { useRouter } from 'next/router'
import React from 'react'
import Auth from './Auth'
import Layout from './Layout'
import FullscreenLoader from './FullscreenLoader'
import useEmail from '../hooks/useEmail'
import { useApp, useAuth } from '../hooks/useFirebase'

interface FirebaseAppProps {
  firebaseOpts: FirebaseOptions
  children: JSX.Element | JSX.Element[]
}

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

  React.useEffect(() => setIsLoading(loading), [loading])

  if (isLoading || isSignIn) {
    if (isSignIn) {
      signInWithEmailLink(email, router.asPath).then(async () => {
        await router.replace(router.pathname, undefined, { shallow: true })
      }).catch(console.log)
    }

    return (
      <FullscreenLoader open={isLoading} />
    )
  } else if (user === null) {
    return (
      <Auth onSubmit={handleSignIn} />
    )
  }

  return (
    <Layout onSignOut={handleSignOut}>{props.children}</Layout>
  )
}

export default FirebaseApp
