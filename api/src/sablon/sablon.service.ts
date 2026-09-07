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
    let result = html

    const eachRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g
    result = result.replace(eachRegex, (_, sorguAd, blok) => {
      const satirlar = sorguSonuclari[sorguAd] || []
      return satirlar.map((satir: any) => {
        return blok.replace(/\{\{(\w+)\}\}/g, (_, kolon) => {
          return satir[kolon] != null ? String(satir[kolon]) : ''
        })
      }).join('')
    })

    result = result.replace(/\{\{(\w+)\.(\w+)\}\}/g, (_, sorguAd, kolon) => {
      const satirlar = sorguSonuclari[sorguAd] || []
      const ilkSatir = satirlar[0]
      return ilkSatir && ilkSatir[kolon] != null ? String(ilkSatir[kolon]) : ''
    })

    return result
  }
}
