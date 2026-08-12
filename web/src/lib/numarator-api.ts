'use client'

import { api } from './api'

export interface Numarator {
  id: number
  ad: string
  onEk: string
  sonNo: number
  kullanimda: boolean
  tip: string
  grupKodu: string | null
}

export type NumaratorFormData = Omit<Numarator, 'id'>

export const numaratorApi = {
  list: (tip?: string) => api.get<Numarator[]>(tip ? `/numarator?tip=${tip}` : '/numarator'),
  get: (id: number) => api.get<Numarator>(`/numarator/${id}`),
  create: (data: NumaratorFormData) => api.post<Numarator>('/numarator', data),
  update: (id: number, data: Partial<NumaratorFormData>) => api.put<Numarator>(`/numarator/${id}`, data),
  delete: (id: number) => api.delete<void>(`/numarator/${id}`),
}
