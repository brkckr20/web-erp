'use client'

import { api } from './api'

export interface Numarator {
  id: number
  ad: string
  onEk: string
  sonNo: number
  kullanimda: boolean
}

export type NumaratorFormData = Omit<Numarator, 'id'>

export const numaratorApi = {
  list: () => api.get<Numarator[]>('/numarator'),
  get: (id: number) => api.get<Numarator>(`/numarator/${id}`),
  create: (data: NumaratorFormData) => api.post<Numarator>('/numarator', data),
  update: (id: number, data: Partial<NumaratorFormData>) => api.put<Numarator>(`/numarator/${id}`, data),
  delete: (id: number) => api.delete<void>(`/numarator/${id}`),
}
