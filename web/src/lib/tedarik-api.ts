'use client'

import { api } from './api'

export interface TedarikHesaplaSatir {
  malzemeId: number
  malzemeKod: string
  malzemeAd: string
  kumasGrupId: number
  kumasGrupKod: string
  renkId: number
  renkKod: string
  renkAd: string
  receteKalemId: number
  siparisKalemId: number
  birim: string
  brutMiktar: number
  netMiktar: number
  kumasNetToplam: number
}

export interface HesaplaSonuc {
  satirlar: TedarikHesaplaSatir[]
  toplamNet: number
  kaydedildi: boolean
}

export interface TedarikIhtiyac {
  id: number
  siparisId: number
  siparisKalemId: number
  receteKalemId: number | null
  malzemeId: number
  malzemeKod: string
  malzemeAd: string
  kumasGrupId: number | null
  kumasGrupKod: string | null
  renkId: number | null
  renkKod: string | null
  renkAd: string | null
  brutMiktar: number
  netMiktar: number
  birim: string
  tip: string
  durum: string
  aciklama: string | null
  kayitYapan: string | null
  kayitTarihi: string
  guncelleyen: string | null
  guncellemeTarihi: string | null
}

export type KarsilamaOneri = 'STOK' | 'HAM_BOYA' | 'TEMIN'

export interface KumasPlanlamaSatir {
  siparisNo: string
  /** Fason talimatı (202) kalemini siparişe bağlamak için. */
  siparisId?: number | null
  siparisKalemId?: number | null
  modelKod: string | null
  modelAd: string | null
  siparisMiktar: number
  musteriAd: string | null
  malzemeKod: string
  malzemeAd: string
  malzemeId?: number | null
  islem: string | null
  varyant1: string
  varyant1Aciklama: string
  varyant1RenkId: number | null
  brutMiktar: number
  gerekenMiktar: number
  birim: string
  guncelMi: boolean
  /** Serbest stok karşılaması (satır birimiyle): aynı malzeme+renk. */
  renkliStok: number
  /** Serbest ham stok (aynı malzeme, renksiz) — boyanabilir. */
  hamStok: number
  /** gereken - renkli - ham (0 altı 0). */
  acikMiktar: number
  /** STOK=stoktan karşıla, HAM_BOYA=hamı boyaya gönder, TEMIN=satın al/dokuma/fason gerekli. */
  oneri: KarsilamaOneri
}

export interface TedarikOzet {
  tipler: { tip: string; kalemSayisi: number; satirSayisi: number; bayatSatirSayisi: number }[]
  kalemSayisi: number
  satirSayisi: number
  bayatSatirSayisi: number
}

export interface SiparisHesaplaSonuc {
  tipler: string[]
  kalemSayisi: number
  islenen: number
  hataSayisi: number
  hatalar: string[]
}

export interface BayatGuncellemeSonuc {
  islenen: number
  guncellenen: number
  hataSayisi: number
  kalan: number
  hatalar: string[]
}

export interface KumasHareketSatiri {
  kalemId: number
  irsaliyeId: number
  fisNo: string
  fisTipi: string
  fisTarihi: string
  miktar: number
  birim: string | null
  depoAd: string | null
  cariAd: string | null
  aciklama: string | null
}

export interface KarsilamaDepoSatir {
  depoKod: string
  depoAd: string
  renkliKg: number
  renkliMt: number
  renkliAdet: number
  hamKg: number
  hamMt: number
  hamAdet: number
}

export const tedarikApi = {
  hesapla: (siparisId: number, kalemId?: number | null, tip?: 'kumas' | 'iplik' | 'aksesuar') =>
    api.post<HesaplaSonuc>(
      `/tedarik/hesapla?siparisId=${siparisId}${kalemId ? `&kalemId=${kalemId}` : ''}${tip ? `&tip=${tip}` : ''}`,
    ),
  list: (siparisId: number, tip?: string, siparisKalemId?: number) =>
    api.get<TedarikIhtiyac[]>(
      `/tedarik?siparisId=${siparisId}${tip ? `&tip=${tip}` : ''}${siparisKalemId ? `&siparisKalemId=${siparisKalemId}` : ''}`,
    ),
  get: (id: number) => api.get<TedarikIhtiyac>(`/tedarik/${id}`),
  remove: (id: number) => api.delete<void>(`/tedarik/${id}`),
  removeAll: (siparisId: number, tip?: string, siparisKalemId?: number) =>
    api.delete<{ silinen: number }>(
      `/tedarik?siparisId=${siparisId}${tip ? `&tip=${tip}` : ''}${siparisKalemId ? `&siparisKalemId=${siparisKalemId}` : ''}`,
    ),
  planlamaKumas: () => api.get<KumasPlanlamaSatir[]>('/tedarik/planlama/kumas'),
  guncelleBayatlar: (limit?: number) =>
    api.post<BayatGuncellemeSonuc>(`/tedarik/guncelle-bayatlar${limit ? `?limit=${limit}` : ''}`),
  ozet: (siparisId: number) => api.get<TedarikOzet>(`/tedarik/ozet?siparisId=${siparisId}`),
  siparisHesapla: (siparisId: number) =>
    api.post<SiparisHesaplaSonuc>(`/tedarik/siparis-hesapla?siparisId=${siparisId}`),
  planlamaKumasHareketler: (siparisNo: string, malzemeKod: string) =>
    api.get<KumasHareketSatiri[]>(
      `/tedarik/planlama/kumas/hareketler?siparisNo=${encodeURIComponent(siparisNo)}&malzemeKod=${encodeURIComponent(malzemeKod)}`,
    ),
  planlamaIplik: () => api.get<KumasPlanlamaSatir[]>('/tedarik/planlama/iplik'),
  planlamaIplikHareketler: (siparisNo: string, malzemeKod: string) =>
    api.get<KumasHareketSatiri[]>(
      `/tedarik/planlama/iplik/hareketler?siparisNo=${encodeURIComponent(siparisNo)}&malzemeKod=${encodeURIComponent(malzemeKod)}`,
    ),
  karsilamaDepo: (malzemeKod: string, renkKod?: string | null, malzemeId?: number | null) =>
    api.get<KarsilamaDepoSatir[]>(
      `/tedarik/planlama/kumas/depo-stok?malzemeKod=${encodeURIComponent(malzemeKod)}${renkKod ? `&renkKod=${encodeURIComponent(renkKod)}` : ''}${malzemeId ? `&malzemeId=${malzemeId}` : ''}`,
    ),
}
