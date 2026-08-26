'use client'

import { api } from './api'

export interface MalzemeYonetimFisi {
  id: number
  irsaliyeNo: string
  irsaliyeTipi: string
  irsaliyeTarihi: string | null
  aciklama: string | null
  faturaNo: string | null
  faturaTarihi: string | null
  sevkNo: string | null
  sevkTarihi: string | null
  onaylandi: boolean
  tamamlandi: boolean
  kayitYapan: string | null
  kayitTarihi: string | null
  guncelleyen: string | null
  guncellemeTarihi: string | null
  cariHesapId: number | null
  depoId: number | null
  cariHesap?: { id: number; kod: string; ad: string } | null
  depo?: { id: number; kod: string; ad: string } | null
  kalemler?: MalzemeYonetimFisiKalem[]
}

export interface MalzemeYonetimFisiKalem {
  id: number
  irsaliyeId: number
  malzemeId: number | null
  tip: string | null
  takipNo: string | null
  brutAgirlik: number | null
  netAgirlik: number | null
  brutMetre: number | null
  netMetre: number | null
  adet: number | null
  olcuBirimi: string | null
  miktar: number | null
  birimFiyat: number | null
  doviz: string | null
  kdv: number | null
  satirTutari: number | null
  aciklama: string | null
  uuid: string | null
  malzeme?: { id: number; kod: string; ad: string } | null
}

export type MalzemeYonetimFisiFormData = Omit<MalzemeYonetimFisi, 'id' | 'kalemler'>

const MALZEME_YONETIM_TIPLERI = '10,16,17,18,20,40,99,101,130,131,132,135,136,137,140'

export const malzemeYonetimFisleriApi = {
  nextIrsaliyeNo: (irsaliyeTipi: string) =>
    api.get<{ irsaliyeNo: string }>(`/irsaliye/next-irsaliye-no?irsaliyeTipi=${encodeURIComponent(irsaliyeTipi)}`),
  list: () => api.get<MalzemeYonetimFisi[]>(`/irsaliye?irsaliyeTipi=${MALZEME_YONETIM_TIPLERI}`),
  get: (id: number) => api.get<MalzemeYonetimFisi>(`/irsaliye/${id}`),
  create: (data: MalzemeYonetimFisiFormData) => api.post<MalzemeYonetimFisi>('/irsaliye', data),
  update: (id: number, data: Partial<MalzemeYonetimFisiFormData>) =>
    api.put<MalzemeYonetimFisi>(`/irsaliye/${id}`, data),
  remove: (id: number) => api.delete<void>(`/irsaliye/${id}`),
}
