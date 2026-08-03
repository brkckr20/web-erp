'use client'

import { api } from './api'

export interface SatisIrsaliye {
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
  fasonTipiId: number | null
  cariHesap?: { id: number; kod: string; ad: string } | null
  depo?: { id: number; kod: string; ad: string } | null
  fasonTipi?: { id: number; ad: string } | null
  kalemler?: SatisIrsaliyeKalem[]
}

export interface SatisIrsaliyeKalem {
  id?: number
  irsaliyeId?: number
  malzemeId: number | null
  tip?: string | null
  takipNo?: string | null
  brutAgirlik?: number | null
  netAgirlik?: number | null
  brutMetre?: number | null
  netMetre?: number | null
  adet?: number | null
  olcuBirimi?: string | null
  miktar: number | null
  birimFiyat: number | null
  doviz: string | null
  kdv: number | null
  satirTutari: number | null
  aciklama: string | null
  uuid: string | null
  malzeme?: { id: number; kod: string; ad: string } | null
}

export type SatisIrsaliyeFormData = Omit<SatisIrsaliye, 'id' | 'kalemler'>

export const satisIrsaliyeApi = {
  nextIrsaliyeNo: (irsaliyeTipi: string) =>
    api.get<{ irsaliyeNo: string }>(`/satis-irsaliye/next-irsaliye-no?irsaliyeTipi=${encodeURIComponent(irsaliyeTipi)}`),
  list: () => api.get<SatisIrsaliye[]>('/satis-irsaliye'),
  get: (id: number) => api.get<SatisIrsaliye>(`/satis-irsaliye/${id}`),
  create: (data: SatisIrsaliyeFormData & { kalemler?: SatisIrsaliyeKalem[] }) =>
    api.post<SatisIrsaliye>('/satis-irsaliye', data),
  update: (id: number, data: Partial<SatisIrsaliyeFormData> & { kalemler?: SatisIrsaliyeKalem[] }) =>
    api.put<SatisIrsaliye>(`/satis-irsaliye/${id}`, data),
  remove: (id: number) => api.delete<void>(`/satis-irsaliye/${id}`),
}
