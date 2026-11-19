'use client'

import { api } from './api'

export interface UretimHareket {
  id: number
  siparisNo: string
  modelKod: string
  modelAd: string | null
  renkAd: string
  beden: string
  rotaKod: string | null
  rotaOperasyonId: number | null
  islemKod: string
  islemAd: string
  yon: string
  miktar: number
  kalite: string
  birimFiyat: number | null
  dovizCinsi: string
  dovizKuru: number | null
  cariKod: string | null
  cariAd: string | null
  tarih: string
  aciklama: string | null
  barkod: string | null
  kayitYapan: string | null
  createdAt: string
  updatedAt: string
}

export type UretimHareketForm = Omit<UretimHareket, 'id' | 'createdAt' | 'updatedAt'>

export const uretimHareketApi = {
  list: (siparisNo?: string) =>
    api.get<UretimHareket[]>(`/uretim-hareket${siparisNo ? `?siparisNo=${encodeURIComponent(siparisNo)}` : ''}`),
  get: (id: number) => api.get<UretimHareket>(`/uretim-hareket/${id}`),
  create: (data: UretimHareketForm) => api.post<UretimHareket>('/uretim-hareket', data),
  topluOlustur: (kayitlar: UretimHareketForm[]) =>
    api.post<UretimHareket[]>('/uretim-hareket/toplu', { kayitlar }),
  update: (id: number, data: UretimHareketForm) => api.put<UretimHareket>(`/uretim-hareket/${id}`, data),
  remove: (id: number) => api.delete<void>(`/uretim-hareket/${id}`),
}
