'use client'

import { api } from './api'

export interface Marka {
  id: number
  kod: string
  ad: string
  kullanimda: boolean
  aciklama: string | null
  createdAt: string
  updatedAt: string
}

export type MarkaFormData = Omit<Marka, 'id' | 'createdAt' | 'updatedAt'>

export const markaApi = {
  list: () => api.get<Marka[]>('/marka'),
  get: (id: number) => api.get<Marka>(`/marka/${id}`),
  getByKod: (kod: string) => api.get<Marka>(`/marka/${encodeURIComponent(kod)}`),
  create: (data: MarkaFormData) => api.post<Marka>('/marka', data),
  update: (id: number, data: Partial<MarkaFormData>) => api.put<Marka>(`/marka/${id}`, data),
  delete: (id: number) => api.delete<void>(`/marka/${id}`),
}
