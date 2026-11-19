'use client'

import { api } from './api'

export interface KumasTalepKalem {
  id: number
  kumasTalepId: number
  kumasKod: string
  kumasAd: string | null
  renk: string | null
  miktar: number
  birim: string
  aciklama: string | null
  sira: number
}

export interface KumasTalep {
  id: number
  talepNo: string
  siparisId: number | null
  siparisNo: string
  tarih: string
  talepEden: string | null
  aciklama: string | null
  durum: string
  olusturanKullanici: number | null
  kalemler: KumasTalepKalem[]
  createdAt: string
  updatedAt: string
}

export interface KumasTalepKalemForm {
  kumasKod: string
  kumasAd?: string | null
  renk?: string | null
  miktar: number
  birim?: string
  aciklama?: string | null
}

export interface KumasTalepForm {
  siparisId?: number | null
  siparisNo: string
  tarih?: string
  talepEden?: string | null
  aciklama?: string | null
  olusturanKullanici?: number | null
  kalemler: KumasTalepKalemForm[]
}

export const kumasTalepApi = {
  list: (siparisNo?: string) =>
    api.get<KumasTalep[]>(`/kumas-talep${siparisNo ? `?siparisNo=${encodeURIComponent(siparisNo)}` : ''}`),
  get: (id: number) => api.get<KumasTalep>(`/kumas-talep/${id}`),
  nextNo: () => api.get<{ talepNo: string }>('/kumas-talep/next-no'),
  create: (data: KumasTalepForm) => api.post<KumasTalep>('/kumas-talep', data),
  update: (id: number, data: KumasTalepForm) => api.put<KumasTalep>(`/kumas-talep/${id}`, data),
  remove: (id: number) => api.delete<void>(`/kumas-talep/${id}`),
}
