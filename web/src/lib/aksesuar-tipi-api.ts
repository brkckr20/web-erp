'use client'

import { api } from './api'

export interface AksesuarTipi {
  id: number
  ad: string
  onEk: string | null
  kullanimda: boolean
}

export type AksesuarTipiFormData = Omit<AksesuarTipi, 'id'>

export const aksesuarTipiApi = {
  list: () => api.get<AksesuarTipi[]>('/aksesuar-tipi'),
  get: (id: number) => api.get<AksesuarTipi>(`/aksesuar-tipi/${id}`),
  create: (data: AksesuarTipiFormData) => api.post<AksesuarTipi>('/aksesuar-tipi', data),
  update: (id: number, data: Partial<AksesuarTipiFormData>) => api.put<AksesuarTipi>(`/aksesuar-tipi/${id}`, data),
  delete: (id: number) => api.delete<void>(`/aksesuar-tipi/${id}`),
}