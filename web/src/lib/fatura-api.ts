'use client'

import { api } from './api'

export interface Fatura {
  id: number
  faturaNo: string
  faturaTipi: string
  faturaTarihi: string | null
  aciklama: string | null
  sevkNo: string | null
  sevkTarihi: string | null
  yetkili: string | null
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
  kalemler?: FaturaKalem[]
  irsaliyeler?: { id: number; irsaliyeTipi: string; irsaliyeNo: string | null }[]
}

export interface FaturaKalem {
  id?: number
  faturaId?: number
  /** Doluysa irsaliyeden snapshot: miktar tarafı kilitli, sunucu kaynaktan kopyalar. */
  irsaliyeKalemId?: number | null
  malzemeId: number | null
  tip?: string | null
  takipNo?: string | null
  brutAgirlik?: number | null
  netAgirlik?: number | null
  brutMetre?: number | null
  netMetre?: number | null
  adet?: number | null
  olcuBirimi?: string | null
  miktar?: number | null
  birimFiyat?: number | null
  doviz?: string | null
  kdv?: number | null
  satirTutari?: number | null
  aciklama?: string | null
  uuid?: string | null
  boyahaneRenkId?: number | null
  varyant1RenkId?: number | null
  varyant2RenkId?: number | null
  varyant1Renk?: { id: number; kod: string; ad: string } | null
  varyant2Renk?: { id: number; kod: string; ad: string } | null
  boyahaneRenk?: { id: number; kod: string; ad: string } | null
  malzeme?: { id: number; kod: string; ad: string; tip?: number; barkod?: string | null } | null
}

export type FaturaFormData = Omit<Fatura, 'id' | 'kalemler'>

export const faturaApi = {
  nextFaturaNo: (faturaTipi: string) =>
    api.get<{ faturaNo: string }>(`/fatura/next-fatura-no?faturaTipi=${encodeURIComponent(faturaTipi)}`),
  list: (faturaTipi?: string) =>
    api.get<Fatura[]>(faturaTipi ? `/fatura?faturaTipi=${encodeURIComponent(faturaTipi)}` : '/fatura'),
  get: (id: number) => api.get<Fatura>(`/fatura/${id}`),
  byNo: (faturaTipi: string, faturaNo: string) =>
    api.get<Fatura>(`/fatura/by-no?faturaTipi=${encodeURIComponent(faturaTipi)}&faturaNo=${encodeURIComponent(faturaNo)}`),
  create: (data: FaturaFormData & { kalemler?: FaturaKalem[]; irsaliyeIds?: number[] }) =>
    api.post<Fatura>('/fatura', data),
  update: (id: number, data: Partial<FaturaFormData> & { kalemler?: FaturaKalem[] }) =>
    api.put<Fatura>(`/fatura/${id}`, data),
  remove: (id: number) => api.delete<void>(`/fatura/${id}`),
  baglanabilirIrsaliyeler: (cariHesapId?: number) =>
    api.get<import('./irsaliye-api').Irsaliye[]>(
      cariHesapId ? `/fatura/baglanabilir-irsaliyeler?cariHesapId=${cariHesapId}` : '/fatura/baglanabilir-irsaliyeler',
    ),
}
