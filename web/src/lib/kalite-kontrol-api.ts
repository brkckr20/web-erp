'use client'

import { api } from './api'

export interface KaliteKontrol {
  id: number
  fisNo: string
  fisTarihi: string | null
  aciklama: string | null
  belgeAdi: string | null
  kayitYapan: string | null
  kayitTarihi: string | null
  cariHesapId: number | null
  cariHesap?: { id: number; kod: string; ad: string } | null
}

export type KaliteKontrolFormData = Omit<KaliteKontrol, 'id'>

export interface KaliteKontrolHata {
  id: number
  kalemId: number
  hataKodu: string
  hataAdi: string
  aciklama: string | null
}

export const kaliteKontrolApi = {
  nextFisNo: () =>
    api.get<{ fisNo: string }>('/kalite-kontrol/next-fis-no'),
  nextBarkod: (depoKod: string) =>
    api.get<{ barkod: string }>(`/kalite-kontrol/next-barkod?depoKod=${encodeURIComponent(depoKod)}`),
  list: () => api.get<KaliteKontrol[]>('/kalite-kontrol'),
  get: (id: number) => api.get<KaliteKontrol>(`/kalite-kontrol/${id}`),
  create: (data: KaliteKontrolFormData) => api.post<KaliteKontrol>('/kalite-kontrol', data),
  update: (id: number, data: Partial<KaliteKontrolFormData>) =>
    api.put<KaliteKontrol>(`/kalite-kontrol/${id}`, data),
  remove: (id: number) => api.delete<void>(`/kalite-kontrol/${id}`),
  stogaAl: (id: number) => api.post<any>(`/kalite-kontrol/${id}/stoga-al`, {}),
  stogaAlinmamis: () => api.get<any[]>(`/kalite-kontrol/stoga-alinmamis`),

  // Hata
  getHatalar: (kalemId: number) =>
    api.get<KaliteKontrolHata[]>(`/kalite-kontrol/kalem/${kalemId}/hata`),
  createHata: (kalemId: number, data: { hataKodu: string; hataAdi: string; aciklama?: string }) =>
    api.post<KaliteKontrolHata>(`/kalite-kontrol/kalem/${kalemId}/hata`, data),
  updateHata: (id: number, data: { hataKodu?: string; hataAdi?: string; aciklama?: string }) =>
    api.put<KaliteKontrolHata>(`/kalite-kontrol/hata/${id}`, data),
  removeHata: (id: number) =>
    api.delete<void>(`/kalite-kontrol/hata/${id}`),
}
