'use client'

import { api } from './api'

export interface Irsaliye {
  id: number
  irsaliyeNo: string
  irsaliyeTipi: string
  irsaliyeTarihi: string | null
  aciklama: string | null
  faturaNo: string | null
  faturaTarihi: string | null
  faturaId?: number | null
  /** Doluysa: 202-Fason Talimatı'ndan oluşmuş irsaliyedir (134). İlişkisiz skaler FK. */
  talimatId?: number | null
  sevkNo: string | null
  sevkTarihi: string | null
  terminTarihi: string | null
  onaylandi: boolean
  tamamlandi: boolean
  kayitYapan: string | null
  kayitTarihi: string | null
  guncelleyen: string | null
  guncellemeTarihi: string | null
  cariHesapId: number | null
  depoId: number | null
  fasonTipiId: number | null
  yetkili: string | null
  cariHesap?: { id: number; kod: string; ad: string } | null
  depo?: { id: number; kod: string; ad: string } | null
  fasonTipi?: { id: number; ad: string } | null
  kalemler?: IrsaliyeKalem[]
}

export interface IrsaliyeKalem {
  id?: number
  irsaliyeId?: number
  malzemeId: number | null
  tip?: string | null
  takipNo?: string | null
  brutAgirlik?: number | null
  netAgirlik?: number | null
  brutMetre?: number | null
  netMetre?: number | null
  adet?: number | null
  olcuBirimi?: string | null
  miktar: number | null
  birimFiyat: number | null
  doviz: string | null
  kdv: number | null
  satirTutari: number | null
  aciklama: string | null
  uuid: string | null
  /** Fason akışında kalemin bağlandığı sipariş kalemi (fire raporu için). */
  siparisKalemId?: number | null
  /** Bu kalemin üretildiği kaynak irsaliye kalemi (202→134, 134→11). */
  kaynakKalemId?: number | null
  /** Fason kumaş bilgileri: istenen gramaj (18,4), ebat, top sayısı. */
  istenenGram?: number | string | null
  ebat?: string | null
  topSayisi?: number | null
  /** Fason fire'ı: sunucu hesaplar (brüt − net), readonly. */
  fire?: number | null
  /**
   * Boyahane hedef rengi (Boyahane Renk Kartı, Renk.tip=2). varyant1 = sipariş/müşteri
   * rengi, varyant2 = baskı deseni (kartı yok, sonraki aşama) olarak ayrılmıştır.
   */
  boyahaneRenkId?: number | null
  varyant1RenkId?: number | null
  varyant2RenkId?: number | null
  varyant1Renk?: { id: number; kod: string; ad: string } | null
  varyant2Renk?: { id: number; kod: string; ad: string } | null
  boyahaneRenk?: { id: number; kod: string; ad: string } | null
  malzeme?: { id: number; kod: string; ad: string; barkod?: string | null } | null
  /** Birleşmiş 202 talimat satırının sipariş/model dağılımı (salt-okunur). */
  tahsisler?: IrsaliyeKalemTahsis[]
  /** Satıra seçilen prosesler (İşlem kartları, sıralı). */
  islemler?: { islemId?: number; sira?: number; islem?: { id: number; kod: string; ad: string } | null }[]
  /** Kaydetmede/aktarımda taşınan proses listesi. */
  prosesler?: { islemId: number; ad?: string; sira?: number }[]
}

export interface IrsaliyeKalemTahsis {
  id?: number
  irsaliyeKalemId?: number
  siparisKalemId?: number | null
  siparisNo?: string | null
  modelKod?: string | null
  miktar: number | string | null
}

export type IrsaliyeFormData = Omit<Irsaliye, 'id' | 'kalemler'>

export const irsaliyeApi = {
  nextIrsaliyeNo: (irsaliyeTipi: string) =>
    api.get<{ irsaliyeNo: string }>(`/irsaliye/next-irsaliye-no?irsaliyeTipi=${encodeURIComponent(irsaliyeTipi)}`),
  list: () => api.get<Irsaliye[]>('/irsaliye'),
  get: (id: number) => api.get<Irsaliye>(`/irsaliye/${id}`),
  create: (data: IrsaliyeFormData & { kalemler?: IrsaliyeKalem[] }) =>
    api.post<Irsaliye>('/irsaliye', data),
  update: (id: number, data: Partial<IrsaliyeFormData> & { kalemler?: IrsaliyeKalem[] }) =>
    api.put<Irsaliye>(`/irsaliye/${id}`, data),
  remove: (id: number) => api.delete<void>(`/irsaliye/${id}`),
}
