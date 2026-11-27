import { api } from './api'

export interface BankaFisHareket {
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

export interface BankaFis {
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
  hareketler: BankaFisHareket[]
}

export interface BankaFisHareketFormData {
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

export interface BankaFisFormData {
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
  hareketler: BankaFisHareketFormData[]
}

export const bankaFisApi = {
  list: (tip?: string) =>
    api.get<BankaFis[]>(`/banka-fis${tip ? `?tip=${encodeURIComponent(tip)}` : ''}`),
  getById: (id: number) => api.get<BankaFis>(`/banka-fis/${id}`),
  create: (data: BankaFisFormData) => api.post<BankaFis>('/banka-fis', data),
  update: (id: number, data: Partial<BankaFisFormData>) =>
    api.put<BankaFis>(`/banka-fis/${id}`, data),
  remove: (id: number) => api.delete<void>(`/banka-fis/${id}`),
  sonrakiNo: (tip: string) =>
    api.get<{ fisNo: number }>(`/banka-fis/sonraki-no?tip=${encodeURIComponent(tip)}`).then((r) => r.fisNo),
}
