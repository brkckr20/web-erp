import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces'
import type { Band, BandHucre, FormTasarimDraft, Hizalama, SayfaAyari } from '@/components/pages/form-tasarimi/types'

const BOYUT_MM: Record<SayfaAyari['boyut'], [number, number]> = {
  A4: [210, 297],
  A5: [148, 210],
  Ozel: [210, 297],
}

const HIZA: Record<Hizalama, 'left' | 'right' | 'center'> = {
  sol: 'left',
  orta: 'center',
  sag: 'right',
}

function alanEtiket(ref: string): string {
  const i = ref.indexOf('.')
  return i >= 0 ? ref.slice(i + 1) : ref
}

function hucreMetin(h: BandHucre): string {
  if (h.alan) {
    const v = alanEtiket(h.alan)
    return h.etiket ? `${h.etiket}: ${v}` : v
  }
  return h.etiket ?? ''
}

function hucrePdf(h: BandHucre): Content {
  const s = h.stil ?? {}
  return {
    text: hucreMetin(h) || ' ',
    fontSize: s.fontBoyutu ?? 9,
    bold: s.kalin ?? false,
    alignment: s.hizalama ? HIZA[s.hizalama] : 'left',
    ...(s.arkaPlan ? { fillColor: s.arkaPlan } : {}),
  }
}

function bandPdf(band: Band): Content {
  if (band.tip === 'kalem-tablo') {
    const kolonlar = band.tabloKolonlari ?? []
    const widths: (string | number)[] = kolonlar.map((k) => (k.genislik && k.genislik > 0 ? k.genislik : '*'))
    const basliklar = kolonlar.map((k) => ({
      text: k.baslik || (k.alan ? alanEtiket(k.alan) : ''),
      bold: true,
      fontSize: 8,
      fillColor: '#f3f4f6',
      alignment: k.hizalama ? HIZA[k.hizalama] : 'left',
    }))
    const ornekSatir = kolonlar.map((k) => ({
      text: k.alan ? alanEtiket(k.alan) : ' ',
      fontSize: 8,
      alignment: k.hizalama ? HIZA[k.hizalama] : 'left',
    }))
    return {
      table: {
        headerRows: 1,
        widths,
        body: [basliklar, ornekSatir],
      },
      layout: 'lightHorizontalLines',
      margin: [0, 3, 0, 3],
    }
  }

  const satirlar = band.satirlar
  const kolonSayisi = satirlar[0]?.hucreler.length ?? 0
  const hasKenarlik = satirlar.some((r) => r.hucreler.some((h) => h.stil?.kenarlik))
  return {
    table: {
      widths: Array.from({ length: kolonSayisi }, () => '*'),
      body: satirlar.map((r) => r.hucreler.map(hucrePdf)),
    },
    layout: hasKenarlik ? 'lightHorizontalLines' : 'noBorders',
    margin: [0, 3, 0, 3],
  }
}

export function formTasarimDoc(form: FormTasarimDraft): TDocumentDefinitions {
  const s = form.sayfa
  const [g, y] = BOYUT_MM[s.boyut] ?? BOYUT_MM.A4
  const pageSize = s.yon === 'yatay' ? { width: y * 2.83, height: g * 2.83 } : { width: g * 2.83, height: y * 2.83 }
  return {
    pageSize,
    pageMargins: [s.kenarSol * 2.83, s.kenarUst * 2.83, s.kenarSag * 2.83, s.kenarAlt * 2.83],
    content: form.layout.map(bandPdf),
  }
}
