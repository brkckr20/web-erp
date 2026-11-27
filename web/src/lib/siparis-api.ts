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

export type SiparisDurum = 'bekliyor' | 'onaylandi' | 'calisiyor' | 'iptal'

export const SIPARIS_DURUM_ETIKET: Record<SiparisDurum, string> = {
  bekliyor: 'Onay Bekliyor',
  onaylandi: 'Onaylandı',
  calisiyor: 'Başladı-Çalışıyor',
  iptal: 'İptal Edildi',
}

export const siparisDurumKodu = (durum?: string | null, onaylandi?: boolean): SiparisDurum => {
  if (durum === 'onaylandi' || durum === 'calisiyor' || durum === 'iptal' || durum === 'bekliyor') return durum
  return onaylandi ? 'onaylandi' : 'bekliyor'
}

export interface Siparis {
  id: number
  siparisNo: string
  ozelKod?: string | null
  numaratorId?: number | null
  numarator?: { id: number; ad: string; onEk: string } | null
  musteriOrderNo?: string | null
  tarih: string
  istemeTarihi?: string | null
  mIstemeTarihi?: string | null
  sertifika?: string | null
  kesimFazlasi?: string | null
  musteriTemsilcisi?: string | null
  toplamTutar?: number | null
  toplamDoviz?: string | null
  onaylandi: boolean
  tamamlandi: boolean
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

export interface SiparisModelOzet {
  id: number
  siparisNo: string
  tarih: string
  musteri: string | null
  miktar: number
}

export const siparisApi = {
  nextNo: (numaratorId: number) =>
    api.get<{ siparisNo: string }>(`/siparis/next-no?numaratorId=${numaratorId}`),
  list: () => api.get<Siparis[]>('/siparis'),
  listByModel: (malzemeId: number) => api.get<SiparisModelOzet[]>(`/siparis/model/${malzemeId}`),
  listByMalzeme: (malzemeId: number) => api.get<SiparisModelOzet[]>(`/siparis/malzeme/${malzemeId}`),
  get: (id: number) => api.get<Siparis>(`/siparis/${id}`),
  bySiparisNo: (siparisNo: string) => api.get<Siparis>(`/siparis/by-siparis-no/${encodeURIComponent(siparisNo)}`),
  create: (data: Partial<SiparisFormData> & { kalemler?: SiparisKalem[]; aciklamalar?: SiparisAciklama[] }) =>
    api.post<Siparis>('/siparis', data),
  update: (id: number, data: Partial<SiparisFormData> & { kalemler?: SiparisKalem[]; aciklamalar?: SiparisAciklama[] }) =>
    api.put<Siparis>(`/siparis/${id}`, data),
  setDurum: (id: number, durum: SiparisDurum) =>
    api.patch<{ id: number; siparisNo: string; onaylandi: boolean; durum: string }>(`/siparis/${id}/durum`, { durum }),
  setDurumToplu: (idler: number[], durum: SiparisDurum) =>
    api.patch<{ guncellenen: number }>('/siparis/durum', { idler, durum }),
  remove: (id: number) => api.delete<void>(`/siparis/${id}`),
}
