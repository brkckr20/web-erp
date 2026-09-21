import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import * as puppeteer from 'puppeteer'
import * as bwipjs from 'bwip-js'

@Injectable()
export class SablonService {
  constructor(private prisma: PrismaService) {}

  async listele(ekranAdi?: string) {
    const where = ekranAdi ? { ekranAdi } : {}
    return this.prisma.sablon.findMany({
      where,
      include: { sorgular: { orderBy: { sira: 'asc' } } },
      orderBy: { ad: 'asc' },
    })
  }

  async getir(id: number) {
    const sablon = await this.prisma.sablon.findUnique({
      where: { id },
      include: { sorgular: { orderBy: { sira: 'asc' } } },
    })
    if (!sablon) throw new NotFoundException('Şablon bulunamadı')
    return sablon
  }

  async olustur(data: {
    ad: string
    ekranAdi: string
    htmlIcerik: string
    sayfaEn?: number
    sayfaBoy?: number
    yon?: string
    ustBosluk?: number
    altBosluk?: number
    solBosluk?: number
    sagBosluk?: number
    sorgular?: { ad: string; sqlIcerik: string; sira?: number }[]
  }) {
    return this.prisma.sablon.create({
      data: {
        ad: data.ad,
        ekranAdi: data.ekranAdi,
        htmlIcerik: data.htmlIcerik,
        sayfaEn: data.sayfaEn ?? 210,
        sayfaBoy: data.sayfaBoy ?? 297,
        yon: data.yon ?? 'dikey',
        ustBosluk: data.ustBosluk ?? 10,
        altBosluk: data.altBosluk ?? 10,
        solBosluk: data.solBosluk ?? 15,
        sagBosluk: data.sagBosluk ?? 15,
        sorgular: data.sorgular
          ? { create: data.sorgular.map((s) => ({ ad: s.ad, sqlIcerik: s.sqlIcerik, sira: s.sira ?? 0 })) }
          : undefined,
      },
      include: { sorgular: true },
    })
  }

  async guncelle(id: number, data: {
    ad?: string
    ekranAdi?: string
    htmlIcerik?: string
    sayfaEn?: number
    sayfaBoy?: number
    yon?: string
    ustBosluk?: number
    altBosluk?: number
    solBosluk?: number
    sagBosluk?: number
    aktif?: boolean
    sorgular?: { id?: number; ad: string; sqlIcerik: string; sira?: number }[]
  }) {
    const mevcut = await this.prisma.sablon.findUnique({ where: { id } })
    if (!mevcut) throw new NotFoundException('Şablon bulunamadı')

    if (data.sorgular) {
      await this.prisma.sablonSorgu.deleteMany({ where: { sablonId: id } })
    }

    return this.prisma.sablon.update({
      where: { id },
      data: {
        ad: data.ad,
        ekranAdi: data.ekranAdi,
        htmlIcerik: data.htmlIcerik,
        sayfaEn: data.sayfaEn,
        sayfaBoy: data.sayfaBoy,
        yon: data.yon,
        ustBosluk: data.ustBosluk,
        altBosluk: data.altBosluk,
        solBosluk: data.solBosluk,
        sagBosluk: data.sagBosluk,
        aktif: data.aktif,
        guncellemeTarihi: new Date(),
        sorgular: data.sorgular
          ? { create: data.sorgular.map((s) => ({ ad: s.ad, sqlIcerik: s.sqlIcerik, sira: s.sira ?? 0 })) }
          : undefined,
      },
      include: { sorgular: true },
    })
  }

  async sil(id: number) {
    const sablon = await this.prisma.sablon.findUnique({ where: { id } })
    if (!sablon) throw new NotFoundException('Şablon bulunamadı')
    return this.prisma.sablon.delete({ where: { id } })
  }

  async sorguCalistir(sql: string, parametreler?: Record<string, any>) {
    let calistirilacakSql = sql
    if (parametreler && Object.keys(parametreler).length > 0) {
      for (const [key, value] of Object.entries(parametreler)) {
        const guvenliDeger = value == null ? 'NULL' : typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : String(value)
        calistirilacakSql = calistirilacakSql.replace(new RegExp(`@${key}\\b`, 'gi'), guvenliDeger)
      }
    }
    return this.prisma.$queryRawUnsafe(calistirilacakSql)
  }

  async onerizle(id: number, parametreler?: Record<string, any>) {
    const sablon = await this.getir(id)
    const sorguSonuclari: Record<string, any[]> = {}

    for (const sorgu of sablon.sorgular) {
      try {
        const sonuc = await this.sorguCalistir(sorgu.sqlIcerik, parametreler)
        sorguSonuclari[sorgu.ad] = sonuc as any[]
      } catch {
        sorguSonuclari[sorgu.ad] = []
      }
    }

    const html = this.htmlBind(sablon.htmlIcerik, sorguSonuclari, await this.barkodResimleri(sorguSonuclari))

    return {
      html,
      sayfaEn: sablon.sayfaEn,
      sayfaBoy: sablon.sayfaBoy,
      yon: sablon.yon,
      ustBosluk: sablon.ustBosluk,
      altBosluk: sablon.altBosluk,
      solBosluk: sablon.solBosluk,
      sagBosluk: sablon.sagBosluk,
    }
  }

  async pdfOlustur(id: number, parametreler?: Record<string, any>): Promise<Buffer> {
    const sonuc = await this.onerizle(id, parametreler)

    const tamHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { margin: 0; padding: 0; }
        </style>
      </head>
      <body>${sonuc.html}</body>
      </html>
    `

    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()
    await page.setContent(tamHtml, { waitUntil: 'load' })

    const footerTpl = `
      <div style="width:100%; font-size:8px; color:#444; box-sizing:border-box; padding:0 ${sonuc.solBosluk}mm;">
        <span style="float:left;">Nakosan Tekstil</span>
        <span style="float:right;">Sayfa: <span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>
    `

    const pdfBuffer = await page.pdf({
      width: `${sonuc.sayfaEn}mm`,
      height: `${sonuc.sayfaBoy}mm`,
      landscape: sonuc.yon === 'yatay',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: footerTpl,
      margin: {
        top: `${sonuc.ustBosluk}mm`,
        bottom: `${Math.max(sonuc.altBosluk, 10)}mm`,
        left: `${sonuc.solBosluk}mm`,
        right: `${sonuc.sagBosluk}mm`,
      },
    })

    await browser.close()
    return Buffer.from(pdfBuffer)
  }

  // Barkod resimleri: sorgu sonuçlarındaki `barkod` kolonlarından Code128 PNG (data URI) üretir.
  // Üretilemeyen kodlar haritada olmaz → hücrede düz metin basılır.
  private async barkodResimleri(sorguSonuclari: Record<string, any[]>): Promise<Map<string, string>> {
    const harita = new Map<string, string>()
    const kodlar = new Set<string>()
    for (const satirlar of Object.values(sorguSonuclari)) {
      for (const r of satirlar ?? []) {
        const kod = r?.['barkod']
        if (kod != null && String(kod).trim() !== '') kodlar.add(String(kod))
      }
    }
    for (const kod of kodlar) {
      try {
        const png = await bwipjs.toBuffer({
          bcid: 'code128',
          text: kod,
          scale: 2,
          height: 10,
          includetext: true,
          textxalign: 'center',
        })
        harita.set(kod, `data:image/png;base64,${png.toString('base64')}`)
      } catch {
        // resim üretilemezse metin basılır
      }
    }
    return harita
  }

  private htmlBind(html: string, sorguSonuclari: Record<string, any[]>, barkodImg = new Map<string, string>()): string {
    // İç içe {{#each}} destekler: en içteki satırdan dışa doğru kapsam zinciriyle {{kolon}} çözülür.
    const result = this.bindEach(html, sorguSonuclari, [], barkodImg)

    return result.replace(/\{\{(\w+)\.(\w+)\}\}/g, (_, sorguAd, kolon) => {
      const satirlar = sorguSonuclari[sorguAd] || []
      const ilkSatir = satirlar[0]
      return ilkSatir && ilkSatir[kolon] != null ? String(ilkSatir[kolon]) : ''
    })
  }

  private bindEach(tpl: string, sorguSonuclari: Record<string, any[]>, kapsam: any[], barkodImg = new Map<string, string>()): string {
    const acilis = /\{\{#each\s+(\w+)\}\}/g
    const eslesme = acilis.exec(tpl)
    if (!eslesme) {
      // each yok: önce matris/kesim etiketleri, sonra kapsam doluysa yalın {{kolon}} çözülür
      const matrisli = this.bindMatris(tpl, sorguSonuclari)
      const kesimli = this.bindKesimTablo(matrisli, sorguSonuclari, kapsam, barkodImg)
      const kumasli = this.bindKumasIhtiyac(kesimli, sorguSonuclari, kapsam)
      if (kapsam.length === 0) return kumasli
      return kumasli.replace(/\{\{(\w+)\}\}/g, (_, kolon) => {
        for (let i = kapsam.length - 1; i >= 0; i--) {
          const v = kapsam[i][kolon]
          if (v != null) return String(v)
        }
        return ''
      })
    }

    const blokAdi = eslesme[1]
    const blokBaslangic = eslesme.index + eslesme[0].length
    // Dengeli kapama: iç içe each'leri sayarak eşleşen {{/each}} bulunur
    let derinlik = 1
    const tarama = /\{\{#each\s+\w+\}\}|\{\{\/each\}\}/g
    tarama.lastIndex = blokBaslangic
    let blokBitis = -1
    let taramaEslesme: RegExpExecArray | null
    while ((taramaEslesme = tarama.exec(tpl)) !== null) {
      if (taramaEslesme[0].startsWith('{{#each')) derinlik++
      else derinlik--
      if (derinlik === 0) {
        blokBitis = taramaEslesme.index
        break
      }
    }
    if (blokBitis === -1) return tpl // kapama yoksa ham bırak

    const on = tpl.slice(0, eslesme.index)
    const ic = tpl.slice(blokBaslangic, blokBitis)
    const son = tpl.slice(blokBitis + '{{/each}}'.length)
    const satirlar = sorguSonuclari[blokAdi] || []
    const genisletilmis = satirlar
      .map((satir: any) => this.bindEach(ic, sorguSonuclari, [...kapsam, satir], barkodImg))
      .join('')

    return this.bindEach(on, sorguSonuclari, kapsam, barkodImg) + genisletilmis + this.bindEach(son, sorguSonuclari, kapsam, barkodImg)
  }

  // Matris bileşeni: uzun formatlı sorguyu çapraz tabloya çevirir.
  // Kullanım: {{#matris matris satir=satir sutun=sutun deger=deger baslik=Renk}}
  // Çok satırlı blok: deger=siparis,kesilecek,kesilen etiket=Sipariş,Kesilecek,Kesilen toplam=1
  // (baslik/etiket/toplam opsiyonel; değerler HTML-escape ile basılır; toplam sayısal hücreleri toplar)
  private bindMatris(tpl: string, sorguSonuclari: Record<string, any[]>): string {
    return tpl.replace(/\{\{#matris\s+(\w+)((?:\s+\w+=(?:"[^"]*"|[^\s}]+))*)(\s*)\}\}/g, (_, sorguAd, paramStr) => {
      const params: Record<string, string> = {}
      const paramRegex = /(\w+)=("[^"]*"|[^\s}]+)/g
      let pm: RegExpExecArray | null
      while ((pm = paramRegex.exec(paramStr)) !== null) {
        params[pm[1]] = pm[2].replace(/^"|"$/g, '')
      }
      const satirKolon = params['satir']
      const sutunKolon = params['sutun']
      const degerKolonlar = (params['deger'] ?? '').split(',').map((d) => d.trim()).filter(Boolean)
      if (!satirKolon || !sutunKolon || degerKolonlar.length === 0) return ''
      const etiketler = (params['etiket'] ?? '').split(',').map((e) => e.trim())
      const toplamAcik = (params['toplam'] ?? '') === '1'
      const satirlar = sorguSonuclari[sorguAd] || []
      const kacis = (v: any): string =>
        v == null ? '' : String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      const sayi = (v: any): number => {
        if (v == null || String(v).trim() === '') return NaN
        const n = Number(String(v).trim())
        return isNaN(n) ? NaN : n
      }
      const sutunlar: string[] = []
      const satirAdlari: string[] = []
      const hucreler = new Map<string, Map<string, any[]>>()
      for (const r of satirlar) {
        const s = r[satirKolon] != null ? String(r[satirKolon]) : ''
        const c = r[sutunKolon] != null ? String(r[sutunKolon]) : ''
        if (!sutunlar.includes(c)) sutunlar.push(c)
        if (!satirAdlari.includes(s)) satirAdlari.push(s)
        if (!hucreler.has(s)) hucreler.set(s, new Map())
        const satirMap = hucreler.get(s)!
        if (!satirMap.has(c)) satirMap.set(c, degerKolonlar.map((dk) => r[dk]))
      }
      const th = 'border:1px solid #ececec; padding:4px 8px'
      const td = th + '; text-align:center'
      const tdSol = th
      const cokDeger = degerKolonlar.length > 1
      let out = '<table style="border-collapse:collapse"><tr>'
      out += `<th style="${th}">${kacis(params['baslik'] ?? '')}</th>`
      if (cokDeger) out += `<th style="${th}"></th>`
      for (const c of sutunlar) out += `<th style="${th}">${kacis(c)}</th>`
      if (toplamAcik) out += `<th style="${th}">Toplam</th>`
      out += '</tr>'
      for (const s of satirAdlari) {
        const satirHucresi = hucreler.get(s)!
        degerKolonlar.forEach((dk, di) => {
          out += '<tr>'
          if (di === 0) out += `<td style="${tdSol}" rowspan="${degerKolonlar.length}">${kacis(s)}</td>`
          if (cokDeger) out += `<td style="${tdSol}">${kacis(etiketler[di] ?? dk)}</td>`
          let toplam = 0
          let varMi = false
          for (const c of sutunlar) {
            const v = satirHucresi.get(c)?.[di]
            out += `<td style="${td}">${kacis(v)}</td>`
            const n = sayi(v)
            if (!isNaN(n)) {
              toplam += n
              varMi = true
            }
          }
          if (toplamAcik) out += `<td style="${td}"><b>${varMi ? kacis(Number.isInteger(toplam) ? toplam : Math.round(toplam * 100) / 100) : ''}</b></td>`
          out += '</tr>'
        })
      }
      return out + '</table>'
    })
  }

  // Kesim talimat tablosu: kumaş grup kolonları + beden kolonları + barkod hücresi, renk başına 2 satır.
  // Kullanım ({{#each}} içinde): {{#kesimTablo kumas=kesim_kumas beden=kesim_beden filtre=kalem_id}}
  // Opsiyonel: barkod=kesim_barkod bosluk=2 cerceve="1px solid black" baslikZemin="#eee" stil="font-family:Arial;font-size:10px"
  // Olculer: genislik=70 yukseklik=24 maxGenislik=90 (px)
  // Beden sıralama: siralama=beden (varsayılan, küçükten büyüğe) | siralama=yazim (bsira'ya göre)
  // kumas sorgusu: kalem_id, renk_id, rsira, kgrup, kkod, kad, khex
  // beden sorgusu: kalem_id, renk_id, rsira, beden, bsira, siparis, kesilecek
  // filtre kolonu kapsamdan okunup iki sorgu da o kaleme süzülür.
  private bindKesimTablo(tpl: string, sorguSonuclari: Record<string, any[]>, kapsam: any[], barkodImg = new Map<string, string>()): string {
    return tpl.replace(/\{\{#kesimTablo\s+(\w+)\s+(\w+)((?:\s+\w+=(?:"[^"]*"|[^\s}]+))*)(\s*)\}\}/g, (_, kumasAd, bedenAd, paramStr) => {
      const params: Record<string, string> = {}
      const paramRegex = /(\w+)=("[^"]*"|[^\s}]+)/g
      let pm: RegExpExecArray | null
      while ((pm = paramRegex.exec(paramStr)) !== null) {
        params[pm[1]] = pm[2].replace(/^"|"$/g, '')
      }
      const filtreKolon = params['filtre']
      const barkodAd = params['barkod']
      const bosluk = Math.max(0, parseInt(params['bosluk'] ?? '2', 10) || 0)
      // Stil parametreleri: stil="font-family:Arial;font-size:12px" cerceve="1px solid black" baslikZemin="#eee"
      const tabloStil = params['stil'] ? ` ${params['stil'].replace(/;?$/, ';')}` : ''
      const cerceve = params['cerceve'] ?? '1px solid gray'
      const baslikZemin = params['baslikZemin'] ? `background-color:${params['baslikZemin']};` : ''
      const maxGenislik = parseInt(params['maxGenislik'] ?? '0', 10) || 0
      const daralt = maxGenislik > 0 ? `max-width:${maxGenislik}px; overflow:hidden;` : ''
      // Hucre olculeri: genislik=70 yukseklik=24 (px; tum hucrelere uygulanir)
      const hucreGenislik = parseInt(params['genislik'] ?? '0', 10) || 0
      const satirYukseklik = parseInt(params['yukseklik'] ?? '0', 10) || 0
      const olcu = `${hucreGenislik > 0 ? `width:${hucreGenislik}px;` : ''}${satirYukseklik > 0 ? `height:${satirYukseklik}px;` : ''}`
      let filtreDeger: any = null
      if (filtreKolon) {
        for (let i = kapsam.length - 1; i >= 0; i--) {
          if (kapsam[i][filtreKolon] != null) {
            filtreDeger = kapsam[i][filtreKolon]
            break
          }
        }
      }
      const süz = (rows: any[]) =>
        filtreKolon && filtreDeger != null ? rows.filter((r) => String(r[filtreKolon]) === String(filtreDeger)) : rows
      const kRows = süz(sorguSonuclari[kumasAd] || [])
      const bRows = süz(sorguSonuclari[bedenAd] || [])
      const barkodRows = barkodAd ? süz(sorguSonuclari[barkodAd] || []) : []
      const barkodMap = new Map<string, string>()
      for (const r of barkodRows) {
        if (r['barkod'] != null && String(r['barkod']).trim() !== '') {
          barkodMap.set(String(r['renk_id']), String(r['barkod']))
        }
      }
      const kacis = (v: any): string =>
        v == null ? '' : String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      // Sıralı tekil listeler
      const sirali = (rows: any[], keyKolon: string, siraKolon: string): string[] => {
        const ilk = new Map<string, number>()
        for (const r of rows) {
          const k = r[keyKolon] != null ? String(r[keyKolon]) : ''
          if (!ilk.has(k)) {
            const s = Number(r[siraKolon])
            ilk.set(k, isNaN(s) ? 999999 : s)
          }
        }
        return [...ilk.entries()].sort((a, b) => a[1] - b[1]).map(([k]) => k)
      }
      const kGruplar = sirali(kRows, 'kgrup', 'ksira')
      // Beden sıralama: sayısal bedenler ("38","40") sayısal, harfli bedenler (S,M,L,XL) standart sıra ile.
      // Varsayılan "beden" (küçükten büyüğe); "yazim" verilirse bsira'ya göre yazım sırası kullanılır.
      const bedenDeger = (beden: any): number => {
        const s = String(beden ?? '').trim().toUpperCase()
        const harfSn: Record<string, number> = { XXS: 5, XS: 10, S: 20, M: 30, L: 40, XL: 50, XXL: 60, '2XL': 60, XXXL: 70, '3XL': 70 }
        if (harfSn[s] != null) return harfSn[s]
        const n = Number(s)
        if (!isNaN(n)) return n
        const m = /^(\d+)/.exec(s)
        if (m) return Number(m[1])
        return 999999
      }
      const benzersizBeden = new Map<string, string>()
      for (const r of bRows) {
        const k = r['beden'] != null ? String(r['beden']) : ''
        if (k !== '' && !benzersizBeden.has(k)) benzersizBeden.set(k, k)
      }
      const bedenSiralama = params['siralama'] ?? 'beden'
      const bedenler =
        bedenSiralama === 'yazim'
          ? sirali(bRows, 'beden', 'bsira')
          : [...benzersizBeden.keys()].sort((a, b) => bedenDeger(a) - bedenDeger(b))
      const renkler = sirali([...kRows, ...bRows], 'renk_id', 'rsira')
      if (renkler.length === 0 || (kGruplar.length === 0 && bedenler.length === 0)) return ''
      const kMap = new Map<string, any>()
      for (const r of kRows) kMap.set(`${r['renk_id']}|${r['kgrup']}`, r)
      const bMap = new Map<string, any>()
      for (const r of bRows) bMap.set(`${r['renk_id']}|${r['beden']}`, r)
      // Hex normalize: #RRGGBB veya #AARRGGBB (alpha düşer); geçersizse ''
      const normHex = (hex: any): string => {
        const m = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.exec(String(hex ?? '').trim())
        if (!m) return ''
        const h = m[1].length === 8 ? m[1].slice(2) : m[1]
        return '#' + h
      }
      // Açık renk zeminde koyu yazı (örn. beyaz), koyu zeminde beyaz yazı
      const yaziRengi = (hex: any): string => {
        const nrm = normHex(hex)
        if (!nrm) return ''
        const n = parseInt(nrm.slice(1), 16)
        const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
        return lum > 0.6 ? '#000' : '#fff'
      }
      const td = `border:${cerceve};${daralt}${olcu}`
      const tdC = td + 'text-align:center;'
      let out = `<table style="border-collapse:collapse; margin-top:4px; font-size:10px;${tabloStil}">`
      out += '<thead><tr>'
      for (const g of kGruplar) out += `<td style="${tdC};${baslikZemin}">${kacis(g)}</td>`
      for (const b of bedenler) out += `<td style="${tdC};${baslikZemin}">${kacis(b)}</td>`
      out += `<td style="${tdC};${baslikZemin}width:24px"></td><td style="${tdC};${baslikZemin}">Renk Barkodu</td>`
      out += '</tr></thead><tbody>'
      renkler.forEach((rid, ri) => {
        // 1. satır: renk kodları + sipariş + barkod
        out += '<tr>'
        for (const g of kGruplar) {
          const r = kMap.get(`${rid}|${g}`)
          const bg = normHex(r?.['khex'])
          const fg = yaziRengi(r?.['khex'])
          out += `<td style="${tdC};${bg ? `background-color:${bg};` : ''}${fg ? `color:${fg};` : ''}">${kacis(r?.['kkod'])}</td>`
        }
        for (const b of bedenler) out += `<td style="${tdC}">${kacis(bMap.get(`${rid}|${b}`)?.['siparis'])}</td>`
        out += `<td style="${td}"></td>`
        const bkod = barkodMap.get(rid) ?? ''
        const bImg = barkodImg.get(bkod)
        const bHucre = bImg
          ? `<img src="${bImg}" style="max-width:100%; height:36px" alt="${kacis(bkod)}" />`
          : kacis(bkod)
        out += `<td style="${tdC}; vertical-align:middle; padding:2px" rowspan="2">${bHucre}</td>`
        out += '</tr>'
        // 2. satır: renk adları + kesilecek
        out += '<tr>'
        for (const g of kGruplar) {
          const r = kMap.get(`${rid}|${g}`)
          out += `<td style="${tdC}">${kacis(r?.['kad'])}</td>`
        }
        for (const b of bedenler) out += `<td style="${tdC}">${kacis(bMap.get(`${rid}|${b}`)?.['kesilecek'])}</td>`
        out += `<td style="${td}"></td>`
        out += '</tr>'
        // Renk grupları arası boşluk (son gruptan sonra yok)
        if (bosluk > 0 && ri < renkler.length - 1) {
          out += `<tr><td colspan="${kGruplar.length + bedenler.length + 2}" style="border:none; height:${bosluk}px"></td></tr>`
        }
      })
      return out + '</tbody></table>'
    })
  }

  // Kumaş ihtiyaç tablosu: {{#kumasIhtiyac <sorguAd> filtre=kalem_id}}
  // kapsamdaki ({{#each}} içindeki) filtre kolonuna göre satırları süzer;
  // sorgunun döndürdüğü kolonları tablo yapar (filtre kolonu otomatik gizlenir).
  // Opsiyonel: etiket="Grup,Kumaş Kodu" gizle="stok_kod" cerceve="1px solid gray" baslikZemin="#eee"
  private bindKumasIhtiyac(tpl: string, sorguSonuclari: Record<string, any[]>, kapsam: any[]): string {
    return tpl.replace(/\{\{#kumasIhtiyac\s+(\w+)((?:\s+\w+=(?:"[^"]*"|[^\s}]+))*)(\s*)\}\}/g, (_, sorguAd, paramStr) => {
      const params: Record<string, string> = {}
      const paramRegex = /(\w+)=("[^"]*"|[^\s}]+)/g
      let pm: RegExpExecArray | null
      while ((pm = paramRegex.exec(paramStr)) !== null) {
        params[pm[1]] = pm[2].replace(/^"|"$/g, '')
      }
      const filtreKolon = params['filtre']
      let filtreDeger: any = null
      if (filtreKolon) {
        for (let i = kapsam.length - 1; i >= 0; i--) {
          if (kapsam[i][filtreKolon] != null) {
            filtreDeger = kapsam[i][filtreKolon]
            break
          }
        }
      }
      const süz = (rows: any[]) =>
        filtreKolon && filtreDeger != null ? rows.filter((r) => String(r[filtreKolon]) === String(filtreDeger)) : rows
      const rows = süz(sorguSonuclari[sorguAd] || [])
      if (rows.length === 0) return ''
      const cerceve = params['cerceve'] ?? '1px solid gray'
      const baslikZemin = params['baslikZemin'] ? `background-color:${params['baslikZemin']};` : ''
      const tabloStil = params['stil'] ? ` ${params['stil'].replace(/;?$/, ';')}` : ''
      const etiketler = params['etiket'] ? params['etiket'].split(',').map((e) => e.trim()) : []
      const gizlenecekler = params['gizle'] ? params['gizle'].split(',').map((g) => g.trim()) : []
      const kacis = (v: any): string =>
        v == null ? '' : String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      const bicim = (v: any): string => {
        if (v == null || String(v).trim() === '') return ''
        const n = Number(String(v).replace(/,/g, '.').trim())
        if (isNaN(n)) return kacis(v)
        return String(Math.round(n * 100) / 100).replace('.', ',')
      }
      let kolonlar = Object.keys(rows[0]).filter((k) => k !== filtreKolon && !gizlenecekler.includes(k))
      if (kolonlar.length === 0) return ''
      const th = `border:${cerceve};${baslikZemin} text-align:left`
      const td = `border:${cerceve}`
      let out = `<table style="border-collapse:collapse; font-size:10px; margin-top:0;${tabloStil}">`
      out += '<thead><tr>'
      kolonlar.forEach((k, i) => out += `<th style="${th}">${kacis(etiketler[i] ?? k)}</th>`)
      out += '</tr></thead><tbody>'
      for (const r of rows) {
        out += '<tr>'
        for (const k of kolonlar) out += `<td style="${td}">${bicim(r[k])}</td>`
        out += '</tr>'
      }
      return out + '</tbody></table>'
    })
  }
}
