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
  takipNo: string | null
}

export const depoStokDetayApi = {
  list: () => api.get<DepoStokDetaySatir[]>('/rapor/depo-stok-detay'),
}
