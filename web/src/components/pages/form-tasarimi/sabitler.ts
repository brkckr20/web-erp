import type { BandHucre, Hizalama, HucreFormat, HucreStil, SayfaAyari } from './types'
import { alanCoz, degerMetin, type VeriMap } from '@/lib/reports/deger-format'

export const OLCU = 2.6

export const BOYUT_MM: Record<SayfaAyari['boyut'], [number, number]> = {
  A4: [210, 297],
  A5: [148, 210],
  Ozel: [210, 297],
}

export const HIZALAMALAR: { value: Hizalama; label: string }[] = [
  { value: 'sol', label: 'Sol' },
  { value: 'orta', label: 'Orta' },
  { value: 'sag', label: 'Sağ' },
]

export const HUCRE_FORMATLARI: { value: HucreFormat; label: string }[] = [
  { value: 'otomatik', label: 'Otomatik' },
  { value: 'tarih-gun-ay-yil', label: 'Tarih — 06.08.2026' },
  { value: 'tarih-yil-ay-gun', label: 'Tarih — 2026-08-06' },
  { value: 'tarih-gun-ay-yil-saat', label: 'Tarih — 06.08.2026 14:30' },
  { value: 'sayi-0', label: 'Sayı — 1.453' },
  { value: 'sayi-1', label: 'Sayı — 1.453,5' },
  { value: 'sayi-2', label: 'Sayı — 1.453,00' },
  { value: 'sayi-3', label: 'Sayı — 1.453,500' },
]

export const TABLO_BASLIK_ARKAPLANLARI: { value: 'gri' | 'yok'; label: string }[] = [
  { value: 'gri', label: 'Gri' },
  { value: 'yok', label: 'Yok' },
]

export const TABLO_CIZGI_STILLERI: { value: 'yatay' | 'kareli' | 'yok'; label: string }[] = [
  { value: 'yatay', label: 'Yatay (alt çizgi)' },
  { value: 'kareli', label: 'Kareli (tüm çizgiler)' },
  { value: 'yok', label: 'Çizgisiz' },
]

export const ARKA_PLANLAR: { value?: string; label: string }[] = [
  { label: 'Yok' },
  { value: '#F3F4F6', label: 'Gri' },
  { value: '#FF9933', label: 'Turuncu' },
  { value: '#DBEAFE', label: 'Açık Mavi' },
  { value: '#FEF3C7', label: 'Açık Sarı' },
]

export const HIZA_CSS: Record<Hizalama, 'left' | 'right' | 'center'> = {
  sol: 'left',
  orta: 'center',
  sag: 'right',
}

export function alanEtiket(ref: string): string {
  const i = ref.indexOf('.')
  return i >= 0 ? ref.slice(i + 1) : ref
}

export function hucreStil(h: BandHucre): HucreStil {
  return h.stil ?? {}
}

export function hucreGosterim(h: BandHucre, ornekVeri?: VeriMap): string {
  if (h.bilesen === 'metin') return h.deger || 'Metin'
  if (h.bilesen === 'checkbox') return `☐ ${h.etiket ?? ''}`
  if (h.bilesen === 'resim') return 'Resim'
  if (h.bilesen === 'tablo') return 'Tablo'
  if (h.bilesen === 'barkod') return '║║║ Barkod ║║║'
  if (h.alan) {
    const c = alanCoz(h.alan)
    const v = c && ornekVeri ? ornekVeri[c.sirano]?.[0]?.[c.kolon] : undefined
    if (v !== undefined && v !== null && v !== '') {
      const deger = degerMetin(v, h.stil?.format)
      return h.etiket ? `${h.etiket}: ${deger}` : deger
    }
    const etiket = alanEtiket(h.alan)
    return h.etiket ? `${h.etiket}: ${etiket}` : etiket
  }
  return h.etiket ?? ''
}

export const yuvarla = (v: number) => Math.round(v * 10) / 10
