'use client'

import { api } from './api'

export interface Grup {
  id: number
  kod: string
  ad: string
  kullanimda: boolean
  aciklama: string | null
  createdAt: string
  updatedAt: string
}

export type GrupFormData = Omit<Grup, 'id' | 'createdAt' | 'updatedAt'>

export const grupApi = {
  list: () => api.get<Grup[]>('/grup'),
  get: (id: number) => api.get<Grup>(`/grup/${id}`),
  getByKod: (kod: string) => api.get<Grup>(`/grup/${encodeURIComponent(kod)}`),
  create: (data: GrupFormData) => api.post<Grup>('/grup', data),
  update: (id: number, data: Partial<GrupFormData>) => api.put<Grup>(`/grup/${id}`, data),
  delete: (id: number) => api.delete<void>(`/grup/${id}`),
}
