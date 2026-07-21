'use client'

import { api } from './api'

export interface OzellikKodlama {
  id: number
  ad: string
  kategori: string
}

export type OzellikKodlamaFormData = Omit<OzellikKodlama, 'id'>

export const ozellikKodlamaApi = {
  list: (kategori?: string) => {
    const params = kategori ? `?kategori=${encodeURIComponent(kategori)}` : ''
    return api.get<OzellikKodlama[]>(`/ozellik-kodlama${params}`)
  },
  get: (id: number) => api.get<OzellikKodlama>(`/ozellik-kodlama/${id}`),
  create: (data: OzellikKodlamaFormData) => api.post<OzellikKodlama>('/ozellik-kodlama', data),
  update: (id: number, data: Partial<OzellikKodlamaFormData>) => api.put<OzellikKodlama>(`/ozellik-kodlama/${id}`, data),
  delete: (id: number) => api.delete<void>(`/ozellik-kodlama/${id}`),
}
