import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Email {
  email: string
  setEmail: (email: string) => void
}

const useEmail = create<Email>()(
  persist(
    (set) => ({
      email: '',
      setEmail: (email: string) => { set({ email }) }
    }), { name: 'email-storage' }
  )
)

export default useEmail
