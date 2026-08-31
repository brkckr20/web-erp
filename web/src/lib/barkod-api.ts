'use client'

import { api } from './api'

export interface BarkodEslesme {
  id: number
  barkodKodu: string
  siparisNo: string
  modelKod: string
  renkKod: string
  beden: string
  kumasKod: string
  kumasRenkKod: string
  modelAd: string | null
  renkAd: string | null
  kumasAd: string | null
  kumasRenkAd: string | null
  olusturmaTarihi: string
}

export type CreateBarkodData = Omit<BarkodEslesme, 'id' | 'barkodKodu' | 'olusturmaTarihi'>

export interface BarkodUretimSonuc {
  siparisNo: string
  toplam: number
  barkodlar: (BarkodEslesme & { tamBarkod: string })[]
}

export const barkodApi = {
  list: (siparisNo?: string) =>
    api.get<BarkodEslesme[]>(`/barkod${siparisNo ? `?siparisNo=${encodeURIComponent(siparisNo)}` : ''}`),
  get: (id: number) => api.get<BarkodEslesme>(`/barkod/${id}`),
  findByKod: (kod: string) => api.get<BarkodEslesme>(`/barkod/ara/${encodeURIComponent(kod)}`),
  tar: (barkod: string) => api.post<BarkodEslesme>('/barkod/tar', { barkod }),
  uret: (siparisId: number) => api.post<BarkodUretimSonuc>(`/barkod/uret/${siparisId}`),
  create: (data: CreateBarkodData) => api.post<BarkodEslesme>('/barkod', data),
  createBatch: (dtos: CreateBarkodData[]) => api.post<BarkodEslesme[]>('/barkod/toplu', dtos),
  remove: (id: number) => api.delete<void>(`/barkod/${id}`),
  removeBySiparis: (siparisNo: string) => api.delete<void>(`/barkod/siparis/${encodeURIComponent(siparisNo)}`),
}
