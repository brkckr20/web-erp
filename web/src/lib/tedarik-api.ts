'use client'

import { api } from './api'

export interface TedarikHesaplaSatir {
  malzemeId: number
  malzemeKod: string
  malzemeAd: string
  kumasGrupId: number
  kumasGrupKod: string
  renkId: number
  renkKod: string
  renkAd: string
  receteKalemId: number
  siparisKalemId: number
  birim: string
  brutMiktar: number
  netMiktar: number
  kumasNetToplam: number
}

export interface HesaplaSonuc {
  satirlar: TedarikHesaplaSatir[]
  toplamNet: number
  kaydedildi: boolean
}

export interface TedarikIhtiyac {
  id: number
  siparisId: number
  siparisKalemId: number
  receteKalemId: number | null
  malzemeId: number
  malzemeKod: string
  malzemeAd: string
  kumasGrupId: number | null
  kumasGrupKod: string | null
  renkId: number | null
  renkKod: string | null
  renkAd: string | null
  brutMiktar: number
  netMiktar: number
  birim: string
  tip: string
  durum: string
  aciklama: string | null
  kayitYapan: string | null
  kayitTarihi: string
  guncelleyen: string | null
  guncellemeTarihi: string | null
}

export interface KumasPlanlamaSatir {
  siparisNo: string
  modelKod: string | null
  modelAd: string | null
  siparisMiktar: number
  musteriAd: string | null
  malzemeKod: string
  malzemeAd: string
  islem: string | null
  varyant1: string
  varyant1Aciklama: string
  gerekenMiktar: number
  birim: string
}

export const tedarikApi = {
  hesapla: (siparisId: number, kalemId?: number | null, tip?: 'kumas' | 'iplik' | 'aksesuar') =>
    api.post<HesaplaSonuc>(
      `/tedarik/hesapla?siparisId=${siparisId}${kalemId ? `&kalemId=${kalemId}` : ''}${tip ? `&tip=${tip}` : ''}`,
    ),
  list: (siparisId: number, tip?: string, siparisKalemId?: number) =>
    api.get<TedarikIhtiyac[]>(
      `/tedarik?siparisId=${siparisId}${tip ? `&tip=${tip}` : ''}${siparisKalemId ? `&siparisKalemId=${siparisKalemId}` : ''}`,
    ),
  get: (id: number) => api.get<TedarikIhtiyac>(`/tedarik/${id}`),
  planlamaKumas: () => api.get<KumasPlanlamaSatir[]>('/tedarik/planlama/kumas'),
}
