'use client'

import { api } from './api'

export interface Gtip {
  id: number
  kod: string
  ad: string
  kullanimda: boolean
  createdAt: string
  updatedAt: string
}

export type GtipFormData = Omit<Gtip, 'id' | 'createdAt' | 'updatedAt'>

export const gtipApi = {
  list: () => api.get<Gtip[]>('/gtip'),
  get: (id: number) => api.get<Gtip>(`/gtip/${id}`),
  create: (data: GtipFormData) => api.post<Gtip>('/gtip', data),
  update: (id: number, data: Partial<GtipFormData>) => api.put<Gtip>(`/gtip/${id}`, data),
  delete: (id: number) => api.delete<void>(`/gtip/${id}`),
}
