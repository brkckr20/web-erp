export interface FormSorguDraft {
  id: string
  sirano: number
  ad: string
  sorguMetni: string
  kolonlar: string[]
  satirlar: Record<string, unknown>[]
  hata?: string
  demoSonuc?: boolean
}

export type BandTipi = 'ust-bilgi' | 'alanlar' | 'kalem-tablo' | 'toplamlar' | 'imza'

export type TabloBaslikArkaPlan = 'gri' | 'yok'

export type TabloCizgiStili = 'yatay' | 'kareli' | 'yok'

export type Hizalama = 'sol' | 'orta' | 'sag'

export type HucreFormat =
  | 'otomatik'
  | 'tarih-gun-ay-yil'
  | 'tarih-yil-ay-gun'
  | 'tarih-gun-ay-yil-saat'
  | 'sayi-0'
  | 'sayi-1'
  | 'sayi-2'
  | 'sayi-3'

export interface HucreStil {
  fontBoyutu?: number
  kalin?: boolean
  hizalama?: Hizalama
  arkaPlan?: string
  kenarlik?: boolean
  format?: HucreFormat
}

export type BilesenTipi = 'veri' | 'metin' | 'checkbox' | 'resim' | 'tablo'

export interface BandHucre {
  id: string
  x: number
  y: number
  genislik: number
  yukseklik: number
  bilesen?: BilesenTipi
  alan?: string
  etiket?: string
  deger?: string
  stil?: HucreStil
}

export interface TabloKolon {
  id: string
  alan?: string
  baslik?: string
  genislik?: number
  hizalama?: Hizalama
  format?: HucreFormat
}

export interface Band {
  id: string
  tip: BandTipi
  ad: string
  elemanlar: BandHucre[]
  yukseklik?: number
  sorguId?: string
  tabloKolonlari?: TabloKolon[]
  baslikArkaPlan?: TabloBaslikArkaPlan
  cizgiStili?: TabloCizgiStili
}

export interface SayfaAyari {
  boyut: 'A4' | 'A5' | 'Ozel'
  yon: 'dikey' | 'yatay'
  kenarUst: number
  kenarAlt: number
  kenarSol: number
  kenarSag: number
}

export interface FormTasarimDraft {
  id: string
  ad: string
  ekranTuru: string
  sorgular: FormSorguDraft[]
  layout: Band[]
  sayfa: SayfaAyari
  sablonId?: number
  kod?: string
}

export type AlanRef = string

export type Secim =
  | { tur: 'band'; bandId: string }
  | { tur: 'hucre'; bandId: string; hucreId: string }
  | { tur: 'kolon'; bandId: string; kolonId: string }
