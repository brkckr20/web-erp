'use client'

import { api } from './api'

export interface SirketAdres {
  id?: number
  baslik?: string | null
  adres?: string | null
  ilce?: string | null
  il?: string | null
  postaKodu?: string | null
  sira?: number | null
}

export interface SirketWeb {
  id?: number
  site: string
  sira?: number | null
}

export interface SirketIban {
  id?: number
  banka?: string | null
  iban: string
  aciklama?: string | null
  sira?: number | null
}

export interface Sirket {
  id: number
  ad: string
  telefon?: string | null
  fax?: string | null
  eposta?: string | null
  vergiDairesi?: string | null
  vergiNo?: string | null
  mersisNo?: string | null
  eFaturaEtiketi?: string | null
  eIrsaliyeEtiketi?: string | null
  adresler?: SirketAdres[]
  webler?: SirketWeb[]
  ibanlar?: SirketIban[]
}

export type SirketFormData = Omit<Sirket, 'id'>

export const sirketApi = {
  list: () => api.get<Sirket[]>('/sirket'),
  get: (id: number) => api.get<Sirket>(`/sirket/${id}`),
  create: (data: SirketFormData) => api.post<Sirket>('/sirket', data),
  update: (id: number, data: Partial<SirketFormData>) => api.put<Sirket>(`/sirket/${id}`, data),
  remove: (id: number) => api.delete<void>(`/sirket/${id}`),
}
