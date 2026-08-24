'use client'

import { api } from './api'

export interface FasonTipi {
  id: number
  ad: string
  kategoriler?: string | null
  kullanimda: boolean
}

export const FASON_KATEGORILER = [
  { key: 'kumas', label: 'Kumaş' },
  { key: 'iplik', label: 'İplik' },
  { key: 'diger', label: 'Diğer' },
]

export const parseKategoriler = (k?: string | null): string[] =>
  (k ?? '').split(';').filter(Boolean)

export type FasonTipiFormData = Omit<FasonTipi, 'id'>

export const fasonTipiApi = {
  list: () => api.get<FasonTipi[]>('/fason-tipi'),
  get: (id: number) => api.get<FasonTipi>(`/fason-tipi/${id}`),
  create: (data: FasonTipiFormData) => api.post<FasonTipi>('/fason-tipi', data),
  update: (id: number, data: Partial<FasonTipiFormData>) => api.put<FasonTipi>(`/fason-tipi/${id}`, data),
  delete: (id: number) => api.delete<void>(`/fason-tipi/${id}`),
}
