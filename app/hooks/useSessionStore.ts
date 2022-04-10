import create from 'zustand';
import { persist } from 'zustand/middleware';
import { Session } from '../api/client';

export type SessionStateStore = {
  session?: Session,
  setSession: (session?: Session) => void;
};

const useSessionStore = create<SessionStateStore>(
  persist(
    (set, get) => ({
      setSession: (session) => set({ session }),
    }),
    {
      name: 'glSession',
    }
  )
);

export default useSessionStore;
