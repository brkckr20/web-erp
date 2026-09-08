'use client'

import { api } from './api'

export interface StokEkstresiSatir {
  tarih: string
  irsaliyeTipi: string
  irsaliyeNo: string
  depoKod: string | null
  depoAd: string | null
  brutKg: number
  kg: number
  brutMt: number
  mt: number
  adet: number
  olcuBirimi: string | null
  birimFiyat: number
  satirTutari: number
  aciklama: string | null
  cariAd: string | null
  yon: 'Giriş' | 'Çıkış'
  miktar: number
}

export const stokEkstresiApi = {
  list: (malzemeKod: string) =>
    api.get<StokEkstresiSatir[]>(`/rapor/malzeme-stok-ekstresi/${encodeURIComponent(malzemeKod)}`),
}
