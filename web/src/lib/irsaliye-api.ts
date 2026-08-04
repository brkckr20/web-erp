'use client'

import { api } from './api'

export interface Irsaliye {
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
  kalemler?: IrsaliyeKalem[]
}

export interface IrsaliyeKalem {
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

export type IrsaliyeFormData = Omit<Irsaliye, 'id' | 'kalemler'>

export const irsaliyeApi = {
  nextIrsaliyeNo: (irsaliyeTipi: string) =>
    api.get<{ irsaliyeNo: string }>(`/irsaliye/next-irsaliye-no?irsaliyeTipi=${encodeURIComponent(irsaliyeTipi)}`),
  list: () => api.get<Irsaliye[]>('/irsaliye'),
  get: (id: number) => api.get<Irsaliye>(`/irsaliye/${id}`),
  create: (data: IrsaliyeFormData & { kalemler?: IrsaliyeKalem[] }) =>
    api.post<Irsaliye>('/irsaliye', data),
  update: (id: number, data: Partial<IrsaliyeFormData> & { kalemler?: IrsaliyeKalem[] }) =>
    api.put<Irsaliye>(`/irsaliye/${id}`, data),
  remove: (id: number) => api.delete<void>(`/irsaliye/${id}`),
}
