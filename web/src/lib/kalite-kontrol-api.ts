'use client'

import { api } from './api'

export interface KaliteKontrolKalem {
  id: number
  barkod: string | null
  /** Partiye bağlı kaçıncı top? (fiş + parti + boyahane rengi + malzeme grubu) */
  topNo: number | null
  /** Bu top hangi irsaliye kaleminden (11-Fasondan Giriş) geldi? */
  irsaliyeKalemId: number | null
  /** Kaynak 11 fişi (grid'de "11 Fiş No"). */
  irsaliyeKalem?: { irsaliye?: { irsaliyeNo: string | null } | null } | null
  malzemeId: number | null
  netAgirlik: number | null
  netMetre: number | null
  adet: number | null
}

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
  depoId: number | null
  depo?: { id: number; kod: string; ad: string } | null
  /** Kalite bekleyen listesi için: hangi 11 kalemleri KK'ya girmiş? */
  kalemler?: KaliteKontrolKalem[]
}

export interface KaliteKontrolKalemFormData {
  barkod?: string | null
  /** Partiye bağlı kaçıncı top? Boşsa sunucu atar. */
  topNo?: number | null
  /** Bu top hangi irsaliye kaleminden (11-Fasondan Giriş) geldi? */
  irsaliyeKalemId?: number | null
  malzemeId?: number
  netAgirlik?: number
  netMetre?: number
  adet?: number
  hataMiktar?: number
  aciklama?: string | null
  isEmriNo?: string | null
  isEmriKg?: number
  hatalar?: { hataKodu: string; hataAdi: string; miktar?: number | null; aciklama?: string | null }[]
}

export interface KaliteKontrolFormData {
  fisNo: string
  fisTarihi?: string | null
  aciklama?: string | null
  belgeAdi?: string | null
  kayitYapan?: string | null
  kayitTarihi?: string | null
  guncelleyen?: string | null
  guncellemeTarihi?: string | null
  cariHesapId?: number | null
  depoId?: number | null
  isEmriId?: number | null
  kalemler?: KaliteKontrolKalemFormData[]
}

export interface KaliteKontrolHata {
  id: number
  kalemId: number
  hataKodu: string
  hataAdi: string
  aciklama: string | null
}


/** "Barkod Detayları": 11 kalemine bağlı KK kalemleri (toplar). */
export interface KaliteKontrolKalemDetay {
  id: number
  barkod: string | null
  topNo: number | null
  fisId: number
  fisNo: string
  fisTarihi: string | null
  kayitYapan: string | null
  kayitTarihi: string | null
  malzemeKod: string | null
  malzemeAd: string | null
  netAgirlik: number | string | null
  netMetre: number | string | null
  adet: number | null
  hatalar: { hataKodu: string; hataAdi: string; miktar: number | null }[]
}

export const kaliteKontrolApi = {
  nextFisNo: () =>
    api.get<{ fisNo: string }>('/kalite-kontrol/next-fis-no'),
  nextBarkod: (depoKod: string) =>
    api.get<{ barkod: string }>(`/kalite-kontrol/next-barkod?depoKod=${encodeURIComponent(depoKod)}`),
  list: () => api.get<KaliteKontrol[]>('/kalite-kontrol'),
  irsaliyeKalemDetay: (irsaliyeKalemId: number) =>
    api.get<KaliteKontrolKalemDetay[]>(`/kalite-kontrol/irsaliye-kalem/${irsaliyeKalemId}`),
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
