'use client'

import ExcelTransferEkrani from './ExcelTransferEkrani'
import { renkTransferApi } from '@/lib/renk-transfer-api'

const ALANLAR = [
  { anahtar: 'kod', etiket: 'Kod', zorunlu: true },
  { anahtar: 'ad', etiket: 'Ad', zorunlu: true },
  { anahtar: 'renk', etiket: 'Renk' },
  { anahtar: 'tip', etiket: 'Tip' },
  { anahtar: 'ozelKod', etiket: 'Özel Kod' },
  { anahtar: 'pantoneNo', etiket: 'Pantone No' },
  { anahtar: 'renkTuru', etiket: 'Renk Türü' },
  { anahtar: 'fiyat', etiket: 'Fiyat' },
  { anahtar: 'dovizCinsi', etiket: 'Döviz Cinsi' },
  { anahtar: 'cariKodu', etiket: 'Cari Kodu' },
  { anahtar: 'aciklama', etiket: 'Açıklama' },
]

const SABLON_SIRASI = [
  'kod',
  'ad',
  'renk',
  'tip',
  'ozelKod',
  'pantoneNo',
  'renkTuru',
  'fiyat',
  'dovizCinsi',
  'cariKodu',
  'aciklama',
] as const

const SABLON_BASLIKLAR = {
  kod: 'Kod',
  ad: 'Ad',
  renk: 'Renk',
  tip: 'Tip',
  ozelKod: 'Özel Kod',
  pantoneNo: 'Pantone No',
  renkTuru: 'Renk Türü',
  fiyat: 'Fiyat',
  dovizCinsi: 'Döviz Cinsi',
  cariKodu: 'Cari Kodu',
  aciklama: 'Açıklama',
}

const SABLON_ORNEK = [
  'KDEN01',
  'Kırmızı',
  '#FF0000',
  1,
  'ZK01',
  '18-1664TCX',
  'standart',
  12.5,
  'TRY',
  'CARI01',
  'Standart kırmızı',
]

export default function RenkKartiTransferi() {
  return (
    <ExcelTransferEkrani
      alanlar={ALANLAR}
      sablonSira={SABLON_SIRASI}
      sablonBasliklar={SABLON_BASLIKLAR}
      sablonOrnek={SABLON_ORNEK}
      sablonDosyaAdi="renk-karti-sablonu.xlsx"
      importFonksiyon={renkTransferApi.import}
    />
  )
}