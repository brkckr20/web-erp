'use client'

import { api } from './api'

export interface FasonTipi {
  id: number
  ad: string
  kullanimda: boolean
}

export type FasonTipiFormData = Omit<FasonTipi, 'id'>

export const fasonTipiApi = {
  list: () => api.get<FasonTipi[]>('/fason-tipi'),
  get: (id: number) => api.get<FasonTipi>(`/fason-tipi/${id}`),
  create: (data: FasonTipiFormData) => api.post<FasonTipi>('/fason-tipi', data),
  update: (id: number, data: Partial<FasonTipiFormData>) => api.put<FasonTipi>(`/fason-tipi/${id}`, data),
  delete: (id: number) => api.delete<void>(`/fason-tipi/${id}`),
}
