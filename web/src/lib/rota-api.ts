'use client'

import { api } from './api'

export interface RotaOperasyon {
  id: number
  sira: number
  operasyonKodu: string
  operasyonAdi: string | null
  varsayilanYer: string | null
  birim: string | null
  birimFiyat: number | null
}

export interface Rota {
  id: number
  kod: string
  ad: string
  ozelKod: string | null
  hizmetKodu: string | null
  kullanimda: boolean
  operasyonlar: RotaOperasyon[]
}

export type RotaFormData = Omit<Rota, 'id'>

export const rotaApi = {
  list: () => api.get<Rota[]>('/rota'),
  getByKod: (kod: string) => api.get<Rota>(`/rota/by-kod/${encodeURIComponent(kod)}`),
  create: (data: RotaFormData) => api.post<Rota>('/rota', data),
  update: (id: number, data: Partial<RotaFormData>) => api.put<Rota>(`/rota/${id}`, data),
  remove: (id: number) => api.delete<void>(`/rota/${id}`),
}
