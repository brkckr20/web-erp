import { api } from './api'

export type KasaBankaTipi = 'kasa' | 'banka'

export interface KasaBankaHesap {
  id: number
  kod: string
  ad: string
  tip: KasaBankaTipi
  dovizKodu: string | null
  isYeriKodu: string | null
  masrafYeriKodu: string | null
  bankaAdi: string | null
  anaBankaKodu: string | null
  subeKodu: string | null
  subeAdi: string | null
  swiftKodu: string | null
  ilgiliKisi: string | null
  erisimKodu: string | null
  ozelKod: string | null
  kullanimda: boolean
  aciklama: string | null
}

export interface CreateKasaBankaHesap {
  kod: string
  ad: string
  tip: KasaBankaTipi
  dovizKodu?: string
  isYeriKodu?: string
  masrafYeriKodu?: string
  bankaAdi?: string
  anaBankaKodu?: string
  subeKodu?: string
  subeAdi?: string
  swiftKodu?: string
  ilgiliKisi?: string
  erisimKodu?: string
  ozelKod?: string
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
