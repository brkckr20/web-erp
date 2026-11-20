'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { ekranYetkisi, type EkranIslemi } from '@/lib/yetki'

interface SekmeEkrani {
  modul: string
  ekran: string
}

// null: sekmenin menüde karşılığı yok → buton görünürlüğü kısıtlanmaz.
const SekmeYetkiContext = createContext<SekmeEkrani | null>(null)

export function SekmeYetkiProvider({ ekran, children }: { ekran: SekmeEkrani | null; children: ReactNode }) {
  return <SekmeYetkiContext.Provider value={ekran}>{children}</SekmeYetkiContext.Provider>
}

/** Aktif sekmenin ekranı için işlem yetkisi döndürür (ör. kaydet / sil / goruntule). */
export function useSekmeYetkisi() {
  const ekran = useContext(SekmeYetkiContext)
  const { kullanici } = useAuth()
  return (islem: EkranIslemi) => ekranYetkisi(kullanici?.izinler, ekran?.modul, ekran?.ekran, islem)
}
