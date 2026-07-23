'use client'

import { api } from './api'

export interface Beden {
  id: number
  kod: string
  sira: number
  kullanimda: boolean
  createdAt: string
  updatedAt: string
}

export type BedenFormData = Omit<Beden, 'id' | 'createdAt' | 'updatedAt'>

export const bedenApi = {
  list: () => api.get<Beden[]>('/beden'),
  get: (id: number) => api.get<Beden>(`/beden/${id}`),
  create: (data: BedenFormData) => api.post<Beden>('/beden', data),
  update: (id: number, data: Partial<BedenFormData>) => api.put<Beden>(`/beden/${id}`, data),
  delete: (id: number) => api.delete<void>(`/beden/${id}`),
}
