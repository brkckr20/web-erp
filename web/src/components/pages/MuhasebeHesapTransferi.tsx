'use client'

import ExcelTransferEkrani from './ExcelTransferEkrani'
import { muhasebeHesapApi } from '@/lib/muhasebe-hesap-api'

const ALANLAR = [
  { anahtar: 'kod', etiket: 'Kod', zorunlu: true },
  { anahtar: 'ad', etiket: 'Ad', zorunlu: true },
]

const SABLON_SIRASI = ['kod', 'ad'] as const
const SABLON_BASLIKLAR = { kod: 'Kod', ad: 'Ad' }
const SABLON_ORNEK = ['100.01.001', 'Kasa']

export default function MuhasebeHesapTransferi() {
  return (
    <ExcelTransferEkrani
      alanlar={ALANLAR}
      sablonSira={SABLON_SIRASI}
      sablonBasliklar={SABLON_BASLIKLAR}
      sablonOrnek={SABLON_ORNEK}
      sablonDosyaAdi="muhasebe-hesap-sablonu.xlsx"
      importFonksiyon={muhasebeHesapApi.import}
    />
  )
}
