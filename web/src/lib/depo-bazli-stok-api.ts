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
