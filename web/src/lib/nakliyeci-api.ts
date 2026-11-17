'use client'

import { api } from './api'

export interface NakliyeciPlaka {
  id: number
  plaka: string
}

export interface Nakliyeci {
  id: number
  unvan: string
  ad: string | null
  soyad: string | null
  tc: string | null
  plakalar: NakliyeciPlaka[]
  aktif: boolean
}

export interface NakliyeciFormData {
  unvan: string
  ad?: string
  soyad?: string
  tc?: string
  plakalar: string[]
  aktif: boolean
}

export const nakliyeciApi = {
  list: () => api.get<Nakliyeci[]>('/nakliyeci'),
  get: (id: number) => api.get<Nakliyeci>(`/nakliyeci/${id}`),
  create: (data: NakliyeciFormData) => api.post<Nakliyeci>('/nakliyeci', data),
  update: (id: number, data: Partial<NakliyeciFormData>) => api.put<Nakliyeci>(`/nakliyeci/${id}`, data),
  delete: (id: number) => api.delete<void>(`/nakliyeci/${id}`),
}
