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

export interface KumasHareketSatiri {
  irsaliyeId: number
  fisNo: string
  fisTipi: string
  fisTarihi: string
  miktar: number
  birim: string | null
  depoAd: string | null
  cariAd: string | null
  aciklama: string | null
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
  remove: (id: number) => api.delete<void>(`/tedarik/${id}`),
  removeAll: (siparisId: number, tip?: string, siparisKalemId?: number) =>
    api.delete<{ silinen: number }>(
      `/tedarik?siparisId=${siparisId}${tip ? `&tip=${tip}` : ''}${siparisKalemId ? `&siparisKalemId=${siparisKalemId}` : ''}`,
    ),
  planlamaKumas: () => api.get<KumasPlanlamaSatir[]>('/tedarik/planlama/kumas'),
  planlamaKumasHareketler: (siparisNo: string, malzemeKod: string) =>
    api.get<KumasHareketSatiri[]>(
      `/tedarik/planlama/kumas/hareketler?siparisNo=${encodeURIComponent(siparisNo)}&malzemeKod=${encodeURIComponent(malzemeKod)}`,
    ),
  planlamaIplik: () => api.get<KumasPlanlamaSatir[]>('/tedarik/planlama/iplik'),
  planlamaIplikHareketler: (siparisNo: string, malzemeKod: string) =>
    api.get<KumasHareketSatiri[]>(
      `/tedarik/planlama/iplik/hareketler?siparisNo=${encodeURIComponent(siparisNo)}&malzemeKod=${encodeURIComponent(malzemeKod)}`,
    ),
}
