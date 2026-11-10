'use client'

import { api } from './api'

export interface DepoBazliStokSatir {
  depoKod: string
  depoAd: string
  malzemeKod: string
  malzemeAd: string
  brutKg: number
  kg: number
  brutMt: number
  mt: number
  adet: number
}

export const depoBazliStokApi = {
  list: () => api.get<DepoBazliStokSatir[]>('/rapor/depo-bazli-stok'),
}

export interface DepoStokDetaySatir extends DepoBazliStokSatir {
  renkKod: string | null
  renkAd: string | null
  siparisNo: string | null
  partiNo: string | null
}

export const depoStokDetayApi = {
  list: () => api.get<DepoStokDetaySatir[]>('/rapor/depo-stok-detay'),
}

export interface DepoBarkodSatir {
  depoKod: string
  depoAd: string
  malzemeKod: string
  malzemeAd: string
  renkKod: string | null
  renkAd: string | null
  partiNo: string | null
  barkod: string | null
  topNo: number | null
  kg: number
  mt: number
  adet: number
  fisNo: string
}

export const depoBarkodApi = {
  list: (depoKod: string) => api.get<DepoBarkodSatir[]>(`/rapor/depo-barkod-stok/${encodeURIComponent(depoKod)}`),
}
