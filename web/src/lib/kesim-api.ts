'use client'

import { api } from './api'

export interface Kesim {
  id: number
  siparisNo: string
  modelKod: string
  modelAd: string | null
  renkAd: string
  beden: string
  planlananMiktar: number
  kesilenMiktar: number
  fireMiktar: number
  kumasAd: string | null
  kumasRenk: string | null
  gerekliMiktar: number
  brutMiktar: number
  kumasMiktar: number
  birimTuketim: number
  beklenenAdet: number
  kalanMT: number
  fireOrani: number
  iadeTalep: boolean
  tarih: string
  durum: string
  kaynakFisId: number | null
  kaynakFisNo: string | null
  kaynakKalemId: number | null
  manuelFire: boolean
  createdAt: string
  updatedAt: string
}

export type KesimForm = Omit<Kesim, 'id' | 'createdAt' | 'updatedAt'>

export const kesimApi = {
  list: (siparisNo?: string) =>
    api.get<Kesim[]>(`/kesim${siparisNo ? `?siparisNo=${encodeURIComponent(siparisNo)}` : ''}`),
  get: (id: number) => api.get<Kesim>(`/kesim/${id}`),
  create: (data: KesimForm) => api.post<Kesim>('/kesim', data),
  topluOlustur: (kayitlar: KesimForm[]) => api.post<Kesim[]>('/kesim/toplu', { kayitlar }),
  update: (id: number, data: KesimForm) => api.put<Kesim>(`/kesim/${id}`, data),
  remove: (id: number) => api.delete<void>(`/kesim/${id}`),
}
