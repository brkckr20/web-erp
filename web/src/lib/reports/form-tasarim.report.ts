import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces'
import type { Band, BandHucre, FormTasarimDraft, Hizalama, SayfaAyari } from '@/components/pages/form-tasarimi/types'
import { alanCoz, degerMetin, type VeriMap } from './deger-format'

export type { VeriMap } from './deger-format'

const MM = 2.83

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

function hucreMetin(h: BandHucre, veri?: VeriMap): string {
  if (h.bilesen === 'metin') return h.deger || ''
  if (h.bilesen === 'checkbox') return `☐ ${h.etiket ?? ''}`
  if (h.bilesen === 'resim') return '[Resim]'
  if (h.bilesen === 'tablo') return '[Tablo]'
  if (h.alan) {
    const c = alanCoz(h.alan)
    const v = c && veri ? veri[c.sirano]?.[0]?.[c.kolon] : undefined
    if (v !== undefined && v !== null && v !== '') {
      const deger = degerMetin(v, h.stil?.format)
      return h.etiket ? `${h.etiket}: ${deger}` : deger
    }
    return h.etiket ?? ''
  }
  return h.etiket ?? ''
}

function elemanPdf(h: BandHucre, x: number, y: number, veri?: VeriMap): Content {
  const s = h.stil ?? {}
  return {
    text: hucreMetin(h, veri) || ' ',
    fontSize: s.fontBoyutu ?? 9,
    bold: s.kalin ?? false,
    alignment: s.hizalama ? HIZA[s.hizalama] : 'left',
    ...(s.arkaPlan ? { fillColor: s.arkaPlan } : {}),
    absolutePosition: { x, y },
  }
}

function kalemTabloPdf(
  band: Band,
  marginTop: number,
  form: FormTasarimDraft,
  veri?: VeriMap,
): { content: Content; yukseklik: number } {
  const kolonlar = band.tabloKolonlari ?? []
  const widths: (string | number)[] = kolonlar.map((k) => (k.genislik && k.genislik > 0 ? k.genislik : '*'))
  const baslikArkaPlan = band.baslikArkaPlan === 'yok' ? undefined : '#f3f4f6'
  const basliklar = kolonlar.map((k) => ({
    text: k.baslik || (k.alan ? alanEtiket(k.alan) : ''),
    bold: true,
    fontSize: 8,
    fillColor: baslikArkaPlan,
    alignment: k.hizalama ? HIZA[k.hizalama] : 'left',
  }))

  let satirlar: Record<string, unknown>[] = []
  if (veri) {
    let sirano: number | undefined
    const ilk = kolonlar.find((k) => k.alan)
    const coz = ilk?.alan ? alanCoz(ilk.alan) : null
    if (coz) sirano = coz.sirano
    else if (band.sorguId) sirano = form.sorgular.find((s) => s.id === band.sorguId)?.sirano
    if (sirano != null) satirlar = veri[sirano] ?? []
  }

  const ornekSatirlar =
    satirlar.length > 0
      ? satirlar.slice(0, 100).map((row) =>
          kolonlar.map((k) => {
            const coz = k.alan ? alanCoz(k.alan) : null
            return {
              text: coz ? degerMetin(row[coz.kolon], k.format) : ' ',
              fontSize: 8,
              alignment: k.hizalama ? HIZA[k.hizalama] : 'left',
            }
          }),
        )
      : [
          kolonlar.map((k) => ({
            text: k.alan ? alanEtiket(k.alan) : ' ',
            fontSize: 8,
            alignment: k.hizalama ? HIZA[k.hizalama] : 'left',
          })),
        ]

  const cizgiStili = band.cizgiStili ?? 'yatay'
  const layout =
    cizgiStili === 'yok'
      ? 'noBorders'
      : cizgiStili === 'kareli'
      ? {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#d1d5db',
          vLineColor: () => '#d1d5db',
          paddingLeft: () => 2,
          paddingRight: () => 2,
          paddingTop: () => 2,
          paddingBottom: () => 2,
        }
      : 'lightHorizontalLines'

  // Tablo pdfmake'te akış elemanı; alt bant elemanları mutlak konumlandığı için tablonun
  // tahmini yüksekliğini cursorY'ye ekleyip üst üste binmeyi önliyoruz.
  const satirYukseklik = satirlar.length > 0 ? satirlar.length : 1
  const yukseklik = 6 + satirYukseklik * 6

  return {
    content: {
      table: {
        headerRows: 1,
        widths,
        body: [basliklar, ...ornekSatirlar],
      },
      layout,
      margin: [0, marginTop, 0, 3],
    },
    yukseklik,
  }
}

export function formTasarimDoc(form: FormTasarimDraft, veri?: VeriMap): TDocumentDefinitions {
  const s = form.sayfa
  const [g, y] = BOYUT_MM[s.boyut] ?? BOYUT_MM.A4
  const pageSize = s.yon === 'yatay' ? { width: y * MM, height: g * MM } : { width: g * MM, height: y * MM }

  // Bantlar üst üste akar; her bant için elemanlar bant başlangıcına göre mutlak konumlanır.
  // Not: pdfmake'te absolutePosition sayfa köşesine göredir (pageMargins'i yok sayar) —
  // bu yüzden kenar boşlukları elle eklenir, tuvalle birebir aynı konum üretilir.
  const content: Content[] = []
  let cursorY = 0
  for (const band of form.layout) {
    if (band.tip === 'kalem-tablo') {
      const tablo = kalemTabloPdf(band, cursorY, form, veri)
      content.push(tablo.content)
      cursorY += tablo.yukseklik
    } else {
      const icerikYukseklik = band.elemanlar.reduce((a, e) => Math.max(a, e.y + e.yukseklik), 8)
      const bandYukseklik = band.yukseklik != null ? Math.max(band.yukseklik, icerikYukseklik) : icerikYukseklik
      for (const h of band.elemanlar) {
        content.push(
          elemanPdf(h, (s.kenarSol + h.x) * MM, (s.kenarUst + cursorY + h.y) * MM, veri),
        )
      }
      cursorY += bandYukseklik
    }
  }

  return {
    pageSize,
    pageMargins: [s.kenarSol * MM, s.kenarUst * MM, s.kenarSag * MM, s.kenarAlt * MM],
    content,
  }
}
