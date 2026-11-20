import { api } from './api'

export type KasaBankaTipi = 'kasa' | 'banka'

export interface KasaBankaHesap {
  id: number
  kod: string
  ad: string
  tip: KasaBankaTipi
  dovizKodu: string | null
  acilisBakiye: number | string
  bankaAdi: string | null
  sube: string | null
  iban: string | null
  hesapNo: string | null
  kullanimda: boolean
  aciklama: string | null
}

export interface CreateKasaBankaHesap {
  kod: string
  ad: string
  tip: KasaBankaTipi
  dovizKodu?: string
  acilisBakiye?: number
  bankaAdi?: string
  sube?: string
  iban?: string
  hesapNo?: string
  kullanimda?: boolean
  aciklama?: string
}

export type UpdateKasaBankaHesap = Partial<CreateKasaBankaHesap>

export const kasaBankaHesapApi = {
  list: (tip?: KasaBankaTipi) =>
    api.get<KasaBankaHesap[]>(tip ? `/kasa-banka-hesap?tip=${tip}` : '/kasa-banka-hesap'),
  getById: (id: number) => api.get<KasaBankaHesap>(`/kasa-banka-hesap/${id}`),
  getByKod: (kod: string) =>
    api.get<KasaBankaHesap>(`/kasa-banka-hesap/by-kod/${encodeURIComponent(kod)}`),
  create: (dto: CreateKasaBankaHesap) => api.post<KasaBankaHesap>('/kasa-banka-hesap', dto),
  update: (id: number, dto: UpdateKasaBankaHesap) =>
    api.put<KasaBankaHesap>(`/kasa-banka-hesap/${id}`, dto),
  remove: (id: number) => api.delete<void>(`/kasa-banka-hesap/${id}`),
}
