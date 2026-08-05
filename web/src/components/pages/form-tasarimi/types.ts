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

export type Hizalama = 'sol' | 'orta' | 'sag'

export interface HucreStil {
  fontBoyutu?: number
  kalin?: boolean
  hizalama?: Hizalama
  arkaPlan?: string
  kenarlik?: boolean
}

export interface BandHucre {
  id: string
  alan?: string
  etiket?: string
  stil?: HucreStil
}

export interface BandSatir {
  id: string
  hucreler: BandHucre[]
}

export interface TabloKolon {
  id: string
  alan?: string
  baslik?: string
  genislik?: number
  hizalama?: Hizalama
}

export interface Band {
  id: string
  tip: BandTipi
  ad: string
  kolonSayisi: number
  satirlar: BandSatir[]
  sorguId?: string
  tabloKolonlari?: TabloKolon[]
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
}

export type AlanRef = string

export type Secim =
  | { tur: 'band'; bandId: string }
  | { tur: 'hucre'; bandId: string; satirId: string; hucreId: string }
  | { tur: 'kolon'; bandId: string; kolonId: string }