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

export type KarsilamaOneri = 'STOK' | 'BOYADA' | 'HAM_BOYA' | 'FREE_TAHSIS' | 'TEMIN'

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
  /** Bu siparişe bağlı ham stok (doğrudan bağ + elle tahsis), satır birimiyle. */
  hamStok: number
  /** Malzemenin hiçbir siparişe bağlı olmayan ham stoğu; tahsis kaynağı. */
  freeStok: number
  /** Bu satıra elle tahsis edilen free stok (bağlı hamın tahsis kısmı), satır birimiyle. */
  tahsisEdilen: number
  /** Fason/planlama aktarımında kullanılan bağlı ham miktarı. */
  hamPay?: number
  /** Boyaya gönderilmiş miktar (134-Fasona Çıkış, tahsis oranıyla satıra paylaştırılmış). */
  boyaGiden?: number
  /** gereken - renkli - boyaGiden - bağlı ham (0 altı 0). */
  acikMiktar: number
  /** STOK=stoktan karşıla, BOYADA=boyada bekliyor, HAM_BOYA=hamı boyaya gönder, FREE_TAHSIS=free stoktan tahsis et, TEMIN=satın al/dokuma gerekli. */
  oneri: KarsilamaOneri
}

export interface TahsisSatir {
  siparisKalemId: number
  siparisNo?: string | null
  modelKod?: string | null
  malzemeId: number
  renkId?: number | null
  birim?: string
  miktar: number
}

export interface TahsisSonucSatir {
  siparisKalemId: number
  malzemeId: number
  renkId: number | null
  tahsisEdilen: number
  kalan: number
}

export interface TahsisSonuc {
  satirlar: TahsisSonucSatir[]
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
  brutKg?: number | null
  kg?: number | null
  brutMt?: number | null
  mt?: number | null
  adet?: number | null
  tahsisMiktar: number
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
  planlamaKumasHareketler: (
    siparisNo: string,
    malzemeKod: string,
    siparisKalemId?: number | null,
    renkId?: number | null,
  ) =>
    api.get<KumasHareketSatiri[]>(
      `/tedarik/planlama/kumas/hareketler?siparisNo=${encodeURIComponent(siparisNo)}&malzemeKod=${encodeURIComponent(malzemeKod)}${siparisKalemId ? `&siparisKalemId=${siparisKalemId}` : ''}${renkId ? `&renkId=${renkId}` : ''}`,
    ),
  tahsisEt: (satirlar: TahsisSatir[]) =>
    api.post<TahsisSonuc>('/tedarik/planlama/tahsis', { satirlar }),
  tahsisKaldir: (siparisKalemId: number, malzemeId: number, renkId?: number | null) =>
    api.delete<{ silinen: number }>(
      `/tedarik/planlama/tahsis?siparisKalemId=${siparisKalemId}&malzemeId=${malzemeId}${renkId ? `&renkId=${renkId}` : ''}`,
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
