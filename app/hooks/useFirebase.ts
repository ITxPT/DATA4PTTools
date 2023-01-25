import {
  FirebaseApp,
  FirebaseOptions,
  getApps,
  getApp,
  initializeApp
} from 'firebase/app'
import {
  getAuth,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signOut,
  User,
  UserCredential
} from 'firebase/auth'
import { useEffect, useState } from 'react'

export const useApp = (
  options: FirebaseOptions,
  name?: string
): FirebaseApp => {
  return getApps().length > 0
    ? getApp(name)
    : initializeApp(options, name)
}

interface AuthState {
  user: User | null
  loading: boolean
  sendSignInLinkToEmail: (email: string, url: string) => Promise<void>
  isSignInWithEmailLink: (url: string) => boolean
  signInWithEmailLink: (email: string, url: string) => Promise<UserCredential>
  signOut: () => Promise<void>
}

export const useAuth = (app: FirebaseApp): AuthState => {
  const auth = getAuth(app)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const sendSignInLink = async (email: string, url: string): Promise<void> => {
    return await sendSignInLinkToEmail(auth, email, {
      url,
      handleCodeInApp: true
    })
  }

  const isSignInLink = (url: string): boolean => {
    return isSignInWithEmailLink(auth, url)
  }

  const signInWithLink = async (email: string, url: string): Promise<UserCredential> => {
    return await signInWithEmailLink(auth, email, url)
  }

  const signOutUser = async (): Promise<void> => {
    return await signOut(auth)
  }

  useEffect(() => {
    return onAuthStateChanged(auth, user => {
      setUser(user)

      setTimeout(() => {
        setLoading(false)
      }, 1000)
    })
  })

  return {
    user,
    loading,
    sendSignInLinkToEmail: sendSignInLink,
    isSignInWithEmailLink: isSignInLink,
    signInWithEmailLink: signInWithLink,
    signOut: signOutUser
  }
}
