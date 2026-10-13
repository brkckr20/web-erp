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

export interface CariHesapAdres {
  id: number
  cariHesapId: number
  kod: string
  tip: string | null
  aciklama: string | null
  adres1: string | null
  adres2: string | null
  ulke: string | null
  sehir: string | null
  ilce: string | null
  mahalle: string | null
  ozelKod: string | null
  telefon: string | null
  fax: string | null
  postaKodu: string | null
  eposta: string | null
  aktif: boolean
  varsayilan: boolean
}

export type CariHesapAdresFormData = Omit<CariHesapAdres, 'id' | 'cariHesapId' | 'kod'>

export const cariHesapApi = {
  list: (search?: string, page?: number, limit?: number, prefix?: string) => {
    const params: string[] = []
    if (search) params.push(`search=${search}`)
    if (page) params.push(`page=${page}`)
    if (limit) params.push(`limit=${limit}`)
    if (prefix) params.push(`prefix=${prefix}`)
    const paramStr = params.join('&')
    return api.get<CariHesap[]>(`/cari-hesap${paramStr ? `?${paramStr}` : ''}`)
  },
  get: (id: number) => api.get<CariHesap>(`/cari-hesap/${id}`),
  getByKod: (kod: string) => api.get<CariHesap>(`/cari-hesap/by-kod/${kod}`),
  create: (data: CariHesapFormData) => api.post<CariHesap>('/cari-hesap', data),
  update: (id: number, data: Partial<CariHesapFormData>) => api.put<CariHesap>(`/cari-hesap/${id}`, data),
  remove: (id: number) => api.delete<void>(`/cari-hesap/${id}`),

  adresList: (cariId: number) => api.get<CariHesapAdres[]>(`/cari-hesap/${cariId}/adresler`),
  adresEkle: (cariId: number, data: CariHesapAdresFormData) => api.post<CariHesapAdres>(`/cari-hesap/${cariId}/adresler`, data),
  adresGuncelle: (adresId: number, data: Partial<CariHesapAdresFormData>) => api.put<CariHesapAdres>(`/cari-hesap/adresler/${adresId}`, data),
  adresSil: (adresId: number) => api.delete<void>(`/cari-hesap/adresler/${adresId}`),
}
