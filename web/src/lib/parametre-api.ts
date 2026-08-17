'use client'

import { api } from './api'

export interface Parametre {
  id: number
  grup: string
  anahtar: string
  deger: string
  guncelleyen: string | null
  guncellemeTarihi: string
}

export const parametreApi = {
  list: (grup?: string) => api.get<Parametre[]>(grup ? `/parametre?grup=${encodeURIComponent(grup)}` : '/parametre'),
  get: (grup: string, anahtar: string) =>
    api.get<Parametre>(`/parametre/${encodeURIComponent(grup)}/${encodeURIComponent(anahtar)}`),
  set: (grup: string, anahtar: string, deger: string, guncelleyen?: string) =>
    api.put<Parametre>(`/parametre/${encodeURIComponent(grup)}/${encodeURIComponent(anahtar)}`, {
      deger,
      guncelleyen: guncelleyen ?? null,
    }),
}
