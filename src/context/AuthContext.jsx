import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './auth-context.js'
import { getSession, onSessionChange, updateSessionUser } from '../api/session.js'
import { fetchProfile, saveProfile, signOut } from '../api/index.js'
import { connectSocket, disconnectSocket } from '../api/socket.js'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getSession)
  const [profile, setProfile] = useState({ forId: null, user: null })

  useEffect(() => onSessionChange(setSession), [])

  const accountId = session?.user?.id ?? null
  const user = accountId && profile.forId === accountId ? profile.user : null
  const loadingUser = Boolean(accountId) && profile.forId !== accountId

  const refreshUser = useCallback(async () => {
    const current = getSession()
    if (!current) return null
    const next = await fetchProfile()
    setProfile({ forId: current.user?.id ?? next.id, user: next })
    updateSessionUser({ id: next.id, name: next.name, avatarUrl: next.avatarUrl })
    return next
  }, [])

  useEffect(() => {
    if (!accountId) {
      disconnectSocket()
      return undefined
    }
    connectSocket()
    let cancelled = false
    fetchProfile()
      .then((next) => {
        if (cancelled) return
        setProfile({ forId: accountId, user: next })
        updateSessionUser({ id: next.id, name: next.name, avatarUrl: next.avatarUrl })
      })
      .catch(() => {
        if (!cancelled) setProfile({ forId: accountId, user: null })
      })
    return () => {
      cancelled = true
    }
  }, [accountId])

  const updateProfile = useCallback(
    async (changes) => {
      const next = await saveProfile(changes)
      setProfile({ forId: accountId, user: next })
      updateSessionUser({ id: next.id, name: next.name, avatarUrl: next.avatarUrl })
      return next
    },
    [accountId],
  )

  const logout = useCallback(() => signOut(), [])

  const value = useMemo(
    () => ({
      session,
      authUser: session?.user ?? null,
      user,
      loadingUser,
      isLoggedIn: Boolean(session?.accessToken),
      refreshUser,
      updateProfile,
      logout,
    }),
    [session, user, loadingUser, refreshUser, updateProfile, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
