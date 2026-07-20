'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { authApi, type LoginResult } from '@/lib/auth-api'

interface AuthState {
  token: string | null
  kullanici: LoginResult['kullanici'] | null
  loading: boolean
}

interface AuthContextType extends AuthState {
  login: (kullaniciAdi: string, sifre: string, beniHatirlat?: boolean) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

function getStorage(beniHatirlat: boolean): Storage {
  return beniHatirlat ? localStorage : sessionStorage
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    kullanici: null,
    loading: true,
  })

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    const kullaniciStr = localStorage.getItem('kullanici') || sessionStorage.getItem('kullanici')
    if (token && kullaniciStr) {
      try {
        setState({
          token,
          kullanici: JSON.parse(kullaniciStr),
          loading: false,
        })
      } catch {
        setState({ token: null, kullanici: null, loading: false })
      }
    } else {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }, [])

  const login = useCallback(async (kullaniciAdi: string, sifre: string, beniHatirlat?: boolean) => {
    const result = await authApi.login(kullaniciAdi, sifre, beniHatirlat)
    const storage = getStorage(!!beniHatirlat)
    storage.setItem('token', result.accessToken)
    storage.setItem('kullanici', JSON.stringify(result.kullanici))
    setState({ token: result.accessToken, kullanici: result.kullanici, loading: false })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('kullanici')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('kullanici')
    setState({ token: null, kullanici: null, loading: false })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
