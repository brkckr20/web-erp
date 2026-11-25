import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces'
import { previewPdf, trDate, trNumber } from './pdf-common'
import type { RaporTasarim } from './rapor-types'
import type { YevmiyeMadde } from '@/lib/yevmiye-defteri-api'
import { MUHASEBE_FIS_TIPLERI } from '@/data/muhasebe-fis-tipleri'

export interface YevmiyeRaporData {
  baslik?: string
  baslangic?: string | null
  bitis?: string | null
  maddeler: YevmiyeMadde[]
}

const fisTipiLabel = (tip?: string) => MUHASEBE_FIS_TIPLERI.find((t) => t.deger === String(tip))?.ad ?? tip ?? '-'

function standartTasarim(data: YevmiyeRaporData): TDocumentDefinitions {
  const donem = data.baslangic || data.bitis
    ? `${trDate(data.baslangic ?? null)} - ${trDate(data.bitis ?? null)}`
    : ''

  const maddeRowCount = (m: YevmiyeMadde) => 1 + m.satirlar.length + 1
  const ROW_LIMIT = 42
  type Page = { maddeler: YevmiyeMadde[]; borc: number; alacak: number }
  const pages: Page[] = []
  let cur: Page = { maddeler: [], borc: 0, alacak: 0 }
  let rows = 0

  for (const m of data.maddeler) {
    const rc = maddeRowCount(m)
    if (rows > 0 && rows + rc > ROW_LIMIT) {
      pages.push(cur)
      cur = { maddeler: [], borc: 0, alacak: 0 }
      rows = 0
    }
    cur.maddeler.push(m)
    for (const s of m.satirlar) {
      cur.borc += Number(s.borc) || 0
      cur.alacak += Number(s.alacak) || 0
    }
    rows += rc
  }
  if (cur.maddeler.length || pages.length === 0) pages.push(cur)

  const genelBorc = data.maddeler.reduce((a, m) => a + m.satirlar.reduce((x, s) => x + (Number(s.borc) || 0), 0), 0)
  const genelAlacak = data.maddeler.reduce((a, m) => a + m.satirlar.reduce((x, s) => x + (Number(s.alacak) || 0), 0), 0)

  const headerRow = () => [
    { text: 'Hesap Kodu', style: 'th' },
    { text: 'Hesap Adı ve Açıklama', style: 'th' },
    { text: 'Detay', style: 'th' },
    { text: 'Borç', style: 'thRight' },
    { text: 'Alacak', style: 'thRight' },
  ]

  const content: Content[] = []
  pages.forEach((page, pi) => {
    content.push({ text: data.baslik || 'Yevmiye Defteri', style: 'title' })
    if (donem) content.push({ text: donem, style: 'subtitle' })

    const body: any[] = [headerRow()]
    for (const m of page.maddeler) {
      const baslik = `-- Madde No: ${m.maddeNo} --  Tarih: ${trDate(m.fisTarihi)}  ${fisTipiLabel(m.fisTipi)}  Fiş No: ${String(m.fisNo).padStart(8, '0')}${m.belgeNo ? `  Belge No: ${m.belgeNo}` : ''}`
      body.push([{ text: baslik, colSpan: 5, style: 'madde' }, {}, {}, {}, {}])
      let maddeBorc = 0
      let maddeAlacak = 0
      for (const s of m.satirlar) {
        maddeBorc += Number(s.borc) || 0
        maddeAlacak += Number(s.alacak) || 0
        const adAciklama = [s.hesapAdi, s.aciklama].filter(Boolean).join(' - ')
        body.push([
          { text: s.hesapKodu ?? '', style: 'td' },
          { text: adAciklama || s.hesapAdi || '', style: 'td' },
          { text: s.detay || '', style: 'td' },
          { text: s.borc ? trNumber(Number(s.borc)) : '', style: 'tdRight' },
          { text: s.alacak ? trNumber(Number(s.alacak)) : '', style: 'tdRight' },
        ])
      }
      body.push([
        { text: '', style: 'td' },
        { text: 'Madde Toplamı', style: 'maddeToplam' },
        { text: '', style: 'td' },
        { text: trNumber(maddeBorc), style: 'maddeToplamRight' },
        { text: trNumber(maddeAlacak), style: 'maddeToplamRight' },
      ])
    }

    if (pi === pages.length - 1) {
      body.push([
        { text: '', style: 'td' },
        { text: 'GENEL TOPLAM', style: 'genelToplam' },
        { text: '', style: 'td' },
        { text: trNumber(genelBorc), style: 'genelToplamRight' },
        { text: trNumber(genelAlacak), style: 'genelToplamRight' },
      ])
    }

    content.push({
      table: { headerRows: 1, widths: [80, '*', 95, 70, 70], body },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex === 0 ? '#f3f4f6' : null),
        hLineColor: () => '#d1d5db',
        vLineColor: () => '#d1d5db',
        paddingLeft: () => 4,
        paddingRight: () => 4,
        paddingTop: () => 3,
        paddingBottom: () => 3,
      },
      ...(pi < pages.length - 1 ? { pageBreak: 'after' } : {}),
    } as Content)
  })

  return {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [24, 28, 24, 42],
    content,
    footer: (currentPage: number) => {
      const page = pages[currentPage - 1]
      const borc = page?.borc ?? 0
      const alacak = page?.alacak ?? 0
      const kutu = (val: number) => ({
        table: { widths: ['*'], body: [[{ text: trNumber(val), style: 'sayfaToplamRight', border: [true, true, true, true] }]] },
        layout: {
          hLineColor: () => '#000',
          vLineColor: () => '#000',
          paddingLeft: () => 3,
          paddingRight: () => 3,
          paddingTop: () => 2,
          paddingBottom: () => 2,
        },
      })
      return {
        margin: [24, 4, 24, 0],
        table: {
          widths: [80, '*', 95, 70, 70],
          body: [[
            { text: `Sayfa ${currentPage}/${pages.length}`, style: 'sayfaNoSol', border: [false, false, false, false], margin: [0, 4, 0, 0] },
            { text: '', border: [false, false, false, false] },
            { text: '', border: [false, false, false, false] },
            { ...kutu(borc), border: [false, false, false, false] } as any,
            { ...kutu(alacak), border: [false, false, false, false] } as any,
          ]],
        },
        layout: 'noBorders',
      } as Content
    },
    styles: {
      title: { fontSize: 14, bold: true, alignment: 'center', margin: [0, 0, 0, 4] },
      subtitle: { fontSize: 9, alignment: 'center', color: '#555', margin: [0, 0, 0, 10] },
      th: { fontSize: 8, bold: true, fillColor: '#f3f4f6' },
      thRight: { fontSize: 8, bold: true, alignment: 'right', fillColor: '#f3f4f6' },
      madde: { fontSize: 8, bold: true, fillColor: '#e5e7eb', margin: [0, 1, 0, 1] },
      td: { fontSize: 8 },
      tdRight: { fontSize: 8, alignment: 'right' },
      maddeToplam: { fontSize: 8, bold: true },
      maddeToplamRight: { fontSize: 8, bold: true, alignment: 'right' },
      genelToplam: { fontSize: 9, bold: true },
      genelToplamRight: { fontSize: 9, bold: true, alignment: 'right' },
      sayfaToplamRight: { fontSize: 8, bold: true, alignment: 'right' },
      sayfaNoSol: { fontSize: 8, color: '#444', alignment: 'left' },
    },
    defaultStyle: { fontSize: 8 },
  }
}

export const yevmiyeDefteriTasarimlari: RaporTasarim[] = [
  {
    id: 'standart',
    label: 'Yevmiye Defteri - Standart',
    aciklama: 'Madde başlıklı, borç/alacak toplamlı standart yevmiye dökümü',
    build: (data: YevmiyeRaporData) => standartTasarim(data),
  },
]

export async function yevmiyeDefteriPdfOnizle(data: YevmiyeRaporData, tasarimId = 'standart', targetWin?: Window | null) {
  const tasarim = yevmiyeDefteriTasarimlari.find((t) => t.id === tasarimId) ?? yevmiyeDefteriTasarimlari[0]
  await previewPdf(tasarim.build(data), targetWin)
}
