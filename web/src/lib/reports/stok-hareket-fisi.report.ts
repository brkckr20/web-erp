import type { Content } from 'pdfmake/interfaces'
import { generatePdf, previewPdf, trNumber, trDate } from './pdf-common'
import type { RaporTasarim, TDocumentDefinitions } from './rapor-types'

export interface FisRaporData {
  fisTipi: string
  fisNo: string
  fisTarihi: string
  sevkTarihi?: string | null
  belgeNo?: string
  cariHesap?: string
  depo?: string
  kayitYapan?: string
  kalemler: {
    malzemeKod: string
    malzemeAd: string
    kg: number
    birimFiyat: number
    doviz: string
    kdv: number
    satirTutari: number
    aciklama?: string
  }[]
  toplamMatrah: number
  toplamKdv: number
  toplam: number
}

// Stok Hareket Fişi — Standart tasarım
function standartTasarim(data: FisRaporData): TDocumentDefinitions {
  const kalemSatirlari = data.kalemler.map((k, i) => [
    String(i + 1),
    k.malzemeKod,
    k.malzemeAd,
    trNumber(k.kg),
    `${trNumber(k.birimFiyat)} ${k.doviz}`,
    `%${trNumber(k.kdv, 0)}`,
    trNumber(k.satirTutari),
  ])

  return {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 40],
    content: [
      { text: 'STOK HAREKET FİŞİ', style: 'baslik', alignment: 'center' },
      { text: data.fisTipi, style: 'altBaslik', alignment: 'center', margin: [0, 0, 0, 12] },
      {
        columns: [
          {
            width: '50%',
            stack: [
              bilgiSatir('Fiş No', data.fisNo),
              bilgiSatir('Fiş Tarihi', trDate(data.fisTarihi)),
              bilgiSatir('Sevk Tarihi', trDate(data.sevkTarihi)),
              bilgiSatir('Belge No', data.belgeNo || '-'),
            ],
          },
          {
            width: '50%',
            stack: [
              bilgiSatir('Cari Hesap', data.cariHesap || '-'),
              bilgiSatir('Depo', data.depo || '-'),
              bilgiSatir('Kayıt Eden', data.kayitYapan || '-'),
            ],
          },
        ],
        margin: [0, 0, 0, 12],
      },
      {
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', '*', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: '#', style: 'tabloBaslik' },
              { text: 'Kod', style: 'tabloBaslik' },
              { text: 'Malzeme', style: 'tabloBaslik' },
              { text: 'Kg', style: 'tabloBaslik' },
              { text: 'Birim Fiyat', style: 'tabloBaslik' },
              { text: 'KDV', style: 'tabloBaslik' },
              { text: 'Tutar', style: 'tabloBaslik' },
            ],
            ...kalemSatirlari.map((row) => row.map((cell, idx) => ({
              text: cell,
              style: idx >= 3 ? 'hucresag' : 'hucre',
            }))),
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 12],
      },
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            stack: [
              toplamSatir('Matrah', trNumber(data.toplamMatrah)),
              toplamSatir('KDV', trNumber(data.toplamKdv)),
              toplamSatir('Genel Toplam', trNumber(data.toplam), true),
            ],
          },
        ],
      },
    ],
    styles: {
      baslik: { fontSize: 16, bold: true },
      altBaslik: { fontSize: 11, color: '#666666' },
      tabloBaslik: { bold: true, fontSize: 9, fillColor: '#f3f4f6' },
      hucre: { fontSize: 9 },
      hucresag: { fontSize: 9, alignment: 'right' },
      etiket: { fontSize: 8, color: '#888888' },
      deger: { fontSize: 10 },
      toplamEtiket: { fontSize: 10, bold: true },
      toplamDeger: { fontSize: 10, bold: true, alignment: 'right' },
    },
  }
}

// Stok Hareket Fişi — Detaylı tasarım (açıklama kolonu + dikey başlık bloğu)
function detayliTasarim(data: FisRaporData): TDocumentDefinitions {
  const kalemSatirlari = data.kalemler.map((k, i) => [
    String(i + 1),
    k.malzemeKod,
    k.malzemeAd,
    trNumber(k.kg),
    `${trNumber(k.birimFiyat)} ${k.doviz}`,
    `%${trNumber(k.kdv, 0)}`,
    trNumber(k.satirTutari),
    k.aciklama || '-',
  ])

  return {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 40],
    content: [
      { text: 'STOK HAREKET FİŞİ (DETAYLI)', style: 'baslik', alignment: 'center' },
      { text: data.fisTipi, style: 'altBaslik', alignment: 'center', margin: [0, 0, 0, 8] },
      {
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: [
            [
              bilgiHucre('Fiş No', data.fisNo),
              bilgiHucre('Fiş Tarihi', trDate(data.fisTarihi)),
              bilgiHucre('Sevk Tarihi', trDate(data.sevkTarihi)),
              bilgiHucre('Belge No', data.belgeNo || '-'),
            ],
            [
              bilgiHucre('Cari Hesap', data.cariHesap || '-'),
              bilgiHucre('Depo', data.depo || '-'),
              bilgiHucre('Kayıt Eden', data.kayitYapan || '-'),
              bilgiHucre('Toplam', `${trNumber(data.toplam)} ₺`),
            ],
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 12],
      },
      {
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', '*', 'auto', 'auto', 'auto', 'auto', '*'],
          body: [
            [
              { text: '#', style: 'tabloBaslik' },
              { text: 'Kod', style: 'tabloBaslik' },
              { text: 'Malzeme', style: 'tabloBaslik' },
              { text: 'Kg', style: 'tabloBaslik' },
              { text: 'Birim Fiyat', style: 'tabloBaslik' },
              { text: 'KDV', style: 'tabloBaslik' },
              { text: 'Tutar', style: 'tabloBaslik' },
              { text: 'Açıklama', style: 'tabloBaslik' },
            ],
            ...kalemSatirlari.map((row) => row.map((cell, idx) => ({
              text: cell,
              style: idx >= 3 && idx <= 6 ? 'hucresag' : 'hucre',
            }))),
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 12],
      },
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            stack: [
              toplamSatir('Matrah', trNumber(data.toplamMatrah)),
              toplamSatir('KDV', trNumber(data.toplamKdv)),
              toplamSatir('Genel Toplam', trNumber(data.toplam), true),
            ],
          },
        ],
      },
    ],
    styles: {
      baslik: { fontSize: 16, bold: true },
      altBaslik: { fontSize: 11, color: '#666666' },
      tabloBaslik: { bold: true, fontSize: 9, fillColor: '#e5e7eb' },
      hucre: { fontSize: 9 },
      hucresag: { fontSize: 9, alignment: 'right' },
      etiket: { fontSize: 8, color: '#888888' },
      deger: { fontSize: 10 },
      toplamEtiket: { fontSize: 10, bold: true },
      toplamDeger: { fontSize: 10, bold: true, alignment: 'right' },
    },
  }
}

function bilgiSatir(etiket: string, deger: string): Content {
  return {
    columns: [
      { width: 90, text: etiket, style: 'etiket' },
      { width: '*', text: deger, style: 'deger' },
    ],
    margin: [0, 1, 0, 1],
  } as Content
}

function bilgiHucre(etiket: string, deger: string): Content {
  return {
    stack: [
      { text: etiket, style: 'etiket' },
      { text: deger, style: 'deger' },
    ],
    margin: [2, 2, 2, 2],
  } as Content
}

function toplamSatir(etiket: string, deger: string, vurgu = false): Content {
  return {
    columns: [
      { width: 110, text: etiket, style: vurgu ? 'toplamEtiket' : 'etiket' },
      { width: 100, text: deger, style: vurgu ? 'toplamDeger' : 'toplamDeger' },
    ],
    margin: [0, 1, 0, 1],
  } as Content
}

// Rapor tasarımları — modalde liste olarak gösterilir.
// Yeni bir tasarım eklemek için buraya bir fonksiyon + tanım eklemen yeterli.
export const stokHareketFisiTasarimlari: RaporTasarim[] = [
  {
    id: 'standart',
    label: 'Standart Fiş',
    aciklama: 'Genel bilgiler + kalem tablosu + toplamlar',
    build: standartTasarim,
  },
  {
    id: 'detayli',
    label: 'Detaylı Fiş',
    aciklama: 'Açıklama kolonu ve kutulu başlık bloğu ile geniş görünüm',
    build: detayliTasarim,
  },
]

export async function stokHareketFisiOnizle(data: FisRaporData, tasarimId: string) {
  const tasarim = stokHareketFisiTasarimlari.find((t) => t.id === tasarimId) ?? stokHareketFisiTasarimlari[0]
  await previewPdf(tasarim.build(data))
}

export async function stokHareketFisiPdfAl(data: FisRaporData, tasarimId: string) {
  const tasarim = stokHareketFisiTasarimlari.find((t) => t.id === tasarimId) ?? stokHareketFisiTasarimlari[0]
  await generatePdf(tasarim.build(data), `stok-hareket-fisi-${data.fisNo || 'yeni'}.pdf`)
}
