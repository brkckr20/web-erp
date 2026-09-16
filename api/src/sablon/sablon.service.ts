import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import * as puppeteer from 'puppeteer'

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

    const html = this.htmlBind(sablon.htmlIcerik, sorguSonuclari)

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

    const pdfBuffer = await page.pdf({
      width: `${sonuc.sayfaEn}mm`,
      height: `${sonuc.sayfaBoy}mm`,
      landscape: sonuc.yon === 'yatay',
      printBackground: true,
      margin: {
        top: `${sonuc.ustBosluk}mm`,
        bottom: `${sonuc.altBosluk}mm`,
        left: `${sonuc.solBosluk}mm`,
        right: `${sonuc.sagBosluk}mm`,
      },
    })

    await browser.close()
    return Buffer.from(pdfBuffer)
  }

  private htmlBind(html: string, sorguSonuclari: Record<string, any[]>): string {
    // İç içe {{#each}} destekler: en içteki satırdan dışa doğru kapsam zinciriyle {{kolon}} çözülür.
    const result = this.bindEach(html, sorguSonuclari, [])

    return result.replace(/\{\{(\w+)\.(\w+)\}\}/g, (_, sorguAd, kolon) => {
      const satirlar = sorguSonuclari[sorguAd] || []
      const ilkSatir = satirlar[0]
      return ilkSatir && ilkSatir[kolon] != null ? String(ilkSatir[kolon]) : ''
    })
  }

  private bindEach(tpl: string, sorguSonuclari: Record<string, any[]>, kapsam: any[]): string {
    const acilis = /\{\{#each\s+(\w+)\}\}/g
    const eslesme = acilis.exec(tpl)
    if (!eslesme) {
      // each yok: önce matris etiketleri, sonra kapsam doluysa yalın {{kolon}} çözülür
      const matrisli = this.bindMatris(tpl, sorguSonuclari)
      if (kapsam.length === 0) return matrisli
      return matrisli.replace(/\{\{(\w+)\}\}/g, (_, kolon) => {
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
      .map((satir: any) => this.bindEach(ic, sorguSonuclari, [...kapsam, satir]))
      .join('')

    return this.bindEach(on, sorguSonuclari, kapsam) + genisletilmis + this.bindEach(son, sorguSonuclari, kapsam)
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
}
