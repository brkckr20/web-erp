'use client'

import { api } from './api'

export interface KumasGrup {
  id: number
  kod: string
  kullanimda: boolean
  createdAt: string
  updatedAt: string
}

export type KumasGrupFormData = Omit<KumasGrup, 'id' | 'createdAt' | 'updatedAt'>

export const kumasGrupApi = {
  list: () => api.get<KumasGrup[]>('/kumas-grup'),
  get: (id: number) => api.get<KumasGrup>(`/kumas-grup/${id}`),
  create: (data: KumasGrupFormData) => api.post<KumasGrup>('/kumas-grup', data),
  update: (id: number, data: Partial<KumasGrupFormData>) => api.put<KumasGrup>(`/kumas-grup/${id}`, data),
  delete: (id: number) => api.delete<void>(`/kumas-grup/${id}`),
}
