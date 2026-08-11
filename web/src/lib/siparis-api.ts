'use client'

import { api } from './api'

export interface SiparisSticker {
  id?: number
  sira: number
  deger?: string | null
}

export interface SiparisRenkBeden {
  id?: number
  bedenId: number
  beden?: { id: number; kod: string } | null
  miktar?: number | null
  fiyat?: number | null
  aciklama?: string | null
  barkod?: string | null
  stickerler?: SiparisSticker[]
}

export interface SiparisRenkKumasGrup {
  id?: number
  kumasGrupId: number
  kumasGrup?: { id: number; kod: string } | null
  renkId?: number | null
  renk?: { id: number; kod: string; ad: string; renk?: string | null } | null
}

export interface SiparisRenk {
  id?: number
  ozelKod?: string | null
  musteriOrderNo?: string | null
  partOrderNo?: string | null
  aciklama?: string | null
  istemeTarihi?: string | null
  fiyat?: number | null
  kesimUretim?: string | null
  lot?: number | null
  lotToplami?: number | null
  toplam?: number | null
  genelToplam?: number | null
  sira?: number
  kumasGruplari?: SiparisRenkKumasGrup[]
  bedenler?: SiparisRenkBeden[]
}

export interface SiparisKalem {
  id?: number
  malzemeId?: number | null
  malzeme?: { id: number; kod: string; ad: string } | null
  aciklama?: string | null
  ozelKod?: string | null
  dovizCinsi?: string | null
  dovizFiyati?: number | null
  dovizKuru?: number | null
  fiyat?: number | null
  miktar?: number | null
  tutar?: number | null
  sira?: number
  renkler?: SiparisRenk[]
}

export interface SiparisAciklama {
  id?: number
  tip: string
  metin?: string | null
}

export interface Siparis {
  id: number
  siparisNo: string
  numaratorId?: number | null
  numarator?: { id: number; ad: string; onEk: string } | null
  musteriOrderNo?: string | null
  tarih: string
  istemeTarihi?: string | null
  mIstemeTarihi?: string | null
  kesimFazlasi?: string | null
  musteriTemsilcisi?: string | null
  toplamTutar?: number | null
  toplamDoviz?: string | null
  onaylandi: boolean
  durum: string
  kayitYapan?: string | null
  kayitTarihi?: string | null
  guncelleyen?: string | null
  guncellemeTarihi?: string | null
  cariHesapId?: number | null
  cariHesap?: { id: number; kod: string; ad: string } | null
  kalemler?: SiparisKalem[]
  aciklamalar?: SiparisAciklama[]
}

export type SiparisFormData = Omit<Siparis, 'id' | 'kalemler' | 'aciklamalar'>

export const siparisApi = {
  nextNo: (numaratorId: number) =>
    api.get<{ siparisNo: string }>(`/siparis/next-no?numaratorId=${numaratorId}`),
  list: () => api.get<Siparis[]>('/siparis'),
  get: (id: number) => api.get<Siparis>(`/siparis/${id}`),
  create: (data: Partial<SiparisFormData> & { kalemler?: SiparisKalem[]; aciklamalar?: SiparisAciklama[] }) =>
    api.post<Siparis>('/siparis', data),
  update: (id: number, data: Partial<SiparisFormData> & { kalemler?: SiparisKalem[]; aciklamalar?: SiparisAciklama[] }) =>
    api.put<Siparis>(`/siparis/${id}`, data),
  remove: (id: number) => api.delete<void>(`/siparis/${id}`),
}
