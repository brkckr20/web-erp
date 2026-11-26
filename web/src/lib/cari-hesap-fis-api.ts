import { api } from './api'

export interface CariHesapFisHareket {
  id?: number
  cariHesapId: number
  cariHesap?: { kod: string; ad: string }
  ozelKod: string | null
  hesapKodu: string | null
  hesapAdi: string | null
  aciklama: string | null
  vadeTarihi: string | null
  belgeNo: string | null
  borc: number | string
  alacak: number | string
  doviz: string | null
  dovizKuru: number | string | null
  borcYerel: number | string
  alacakYerel: number | string
  belgeTuru: string | null
  belgeId: number | null
  kontrol: string | null
}

export interface CariHesapFis {
  id: number
  fisTipi: string
  fisNo: number
  fisTarihi: string
  belgeNo: string | null
  k: string | null
  erisimKodu: string | null
  ozelKod: string | null
  dovizCinsi: string | null
  dovizKuru: number | string | null
  kurTarihi: string | null
  masrafYeri: string | null
  masrafYeriId?: number | null
  aciklama: string | null
  hareketler: CariHesapFisHareket[]
}

export interface CariHesapFisHareketFormData {
  cariHesapId: number
  ozelKod?: string | null
  hesapKodu?: string | null
  hesapAdi?: string | null
  aciklama?: string | null
  vadeTarihi?: string | null
  belgeNo?: string | null
  borc?: number
  alacak?: number
  doviz?: string | null
  dovizKuru?: number | null
  belgeTuru?: string | null
  belgeId?: number | null
  kontrol?: string | null
}

export interface CariHesapFisFormData {
  fisTipi: string
  fisTarihi: string
  belgeNo?: string | null
  k?: string | null
  erisimKodu?: string | null
  ozelKod?: string | null
  dovizCinsi?: string | null
  dovizKuru?: number | null
  kurTarihi?: string | null
  masrafYeri?: string | null
  masrafYeriId?: number | null
  aciklama?: string | null
  hareketler: CariHesapFisHareketFormData[]
}

export const cariHesapFisApi = {
  list: (tip?: string) =>
    api.get<CariHesapFis[]>(`/cari-hesap-fis${tip ? `?tip=${encodeURIComponent(tip)}` : ''}`),
  getById: (id: number) => api.get<CariHesapFis>(`/cari-hesap-fis/${id}`),
  create: (data: CariHesapFisFormData) => api.post<CariHesapFis>('/cari-hesap-fis', data),
  update: (id: number, data: Partial<CariHesapFisFormData>) =>
    api.put<CariHesapFis>(`/cari-hesap-fis/${id}`, data),
  remove: (id: number) => api.delete<void>(`/cari-hesap-fis/${id}`),
  sonrakiNo: (tip: string) =>
    api.get<{ fisNo: number }>(`/cari-hesap-fis/sonraki-no?tip=${encodeURIComponent(tip)}`).then((r) => r.fisNo),
}
