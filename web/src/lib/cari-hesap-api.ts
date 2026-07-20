'use client'

import { api } from './api'

export interface CariHesap {
  id: number
  kod: string
  ad: string
  kullanimda: boolean
  erisimKodu: string | null
  ozelKod: string | null
  grubu: string | null
  sektoru: string | null
  ticariIslemGrubu: string | null
  cariHesapTipi: string | null
  cariHesapTuru: string | null
  ticariUnvani: string | null
  personel: string | null
  satisPersoneli: string | null
  satisKanali: string | null
  araciKurum: string | null
  potansiyel: boolean
  bayi: boolean
  faktoring: boolean
  musteriHesapKodu: string | null
  saticiHesapKodu: string | null
  vadeFarkiFaizOrani: string | null
  vadeOpsiyonu: string | null
  odemePlani: string | null
  indirimKodu: string | null
  fiyatKodu: string | null
  alisIndirimKodu: string | null
  satisIndirimKodu: string | null
  vergiDairesi: string | null
  vergiNo: string | null
  dovizCinsi: string | null
  dovizKurTipi: string | null
}

export type CariHesapFormData = Omit<CariHesap, 'id'>

export const cariHesapApi = {
  list: () => api.get<CariHesap[]>('/cari-hesap'),
  get: (id: number) => api.get<CariHesap>(`/cari-hesap/${id}`),
  getByKod: (kod: string) => api.get<CariHesap>(`/cari-hesap/by-kod/${kod}`),
  create: (data: CariHesapFormData) => api.post<CariHesap>('/cari-hesap', data),
  update: (id: number, data: Partial<CariHesapFormData>) => api.put<CariHesap>(`/cari-hesap/${id}`, data),
  remove: (id: number) => api.delete<void>(`/cari-hesap/${id}`),
}
