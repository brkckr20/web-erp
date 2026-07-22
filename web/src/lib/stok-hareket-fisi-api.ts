'use client'

import { api } from './api'

export interface StokHareketFisi {
  id: number
  fisNo: string
  fisTipi: string
  fisTarihi: string | null
  aciklama: string | null
  faturaNo: string | null
  faturaTarihi: string | null
  sevkNo: string | null
  sevkTarihi: string | null
  vadeTarihi: string | null
  yetkili: string | null
  onaylandi: boolean
  tamamlandi: boolean
  musteriSiparisNo: string | null
  siparisNo: string | null
  vade: number | null
  odemeTipi: string | null
  kayitYapan: string | null
  kayitTarihi: string | null
  guncelleyen: string | null
  guncellemeTarihi: string | null
  tasiyiciId: number | null
  nakliyeciId: number | null
  belgeAdi: string | null
  cariHesapId: number | null
  depoId: number | null
  cariHesap?: { id: number; kod: string; ad: string } | null
  depo?: { id: number; kod: string; ad: string } | null
  kalemler?: StokHareketFisiKalem[]
}

export interface StokHareketFisiKalem {
  id: number
  fisId: number
  islemTipi: string | null
  malzemeId: number | null
  grM2: number | null
  brutAgirlik: number | null
  netAgirlik: number | null
  brutMetre: number | null
  netMetre: number | null
  adet: number | null
  dovizFiyati: number | null
  doviz: string | null
  birimFiyat: number | null
  variantId: number | null
  renkId: number | null
  aciklama: string | null
  uuid: string | null
  takipNo: string | null
  desenId: number | null
  islemId: number | null
  satirTutari: number | null
  kdv: number | null
  alici: string | null
  olcuBirimi: string | null
  fisNo: string | null
  marka: string | null
  fire: number | null
  miktar: number | null
  variant: string | null
  pesinOdeme: boolean
  vadeliOdeme: boolean
  satirAciklama: string | null
  partiNo: string | null
  siparisNo: string | null
  musteriSiparisNo: string | null
  maliyetHesaplandi: boolean
  cipLi: boolean
}

export type StokHareketFisiFormData = Omit<StokHareketFisi, 'id' | 'kalemler'>

export const stokHareketFisiApi = {
  nextFisNo: (fisTipi: string) =>
    api.get<{ fisNo: string }>(`/stok-hareket-fisi/next-fis-no?fisTipi=${encodeURIComponent(fisTipi)}`),
  list: () => api.get<StokHareketFisi[]>('/stok-hareket-fisi'),
  get: (id: number) => api.get<StokHareketFisi>(`/stok-hareket-fisi/${id}`),
  getByFisNo: (fisNo: string) =>
    api.get<StokHareketFisi>(`/stok-hareket-fisi/by-fis-no/${encodeURIComponent(fisNo)}`),
  create: (data: StokHareketFisiFormData) => api.post<StokHareketFisi>('/stok-hareket-fisi', data),
  update: (id: number, data: Partial<StokHareketFisiFormData>) =>
    api.put<StokHareketFisi>(`/stok-hareket-fisi/${id}`, data),
  remove: (id: number) => api.delete<void>(`/stok-hareket-fisi/${id}`),
  kkKalemEkle: (fisId: number, kkKalemIds: number[]) =>
    api.post<any[]>(`/stok-hareket-fisi/${fisId}/kk-kalem-ekle`, { kkKalemIds }),
  kkIsaretle: (fisId: number, kkKalemIds: number[]) =>
    api.post<void>(`/stok-hareket-fisi/${fisId}/kk-isaretle`, { kkKalemIds }),
}
