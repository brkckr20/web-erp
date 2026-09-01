import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import * as fs from 'fs'
import * as path from 'path'

export interface DepoBazliStokSatir {
  depoKod: string
  depoAd: string
  malzemeKod: string
  malzemeAd: string
  brutKg: number
  kg: number
  brutMt: number
  mt: number
  adet: number
}

@Injectable()
export class RaporService {
  constructor(private prisma: PrismaService) {}

  async depoBazliStok(): Promise<DepoBazliStokSatir[]> {
    // İrsaliye tipleri: giriş (+1), çıkış (-1). Sadece tamamlandı olanlar stoğa yansır.
    const irsaliyeYon = `
      CASE
        WHEN i.irsaliye_tipi IN ('1','2','3','4','5','9','10','11','12','16','17','18','20','40','101') THEN 1
        WHEN i.irsaliye_tipi IN ('8','99','120','121','122','123','124','130','131','132','134','135','136','137','140') THEN -1
        ELSE 0
      END
    `

    const rows = await this.prisma.$queryRawUnsafe<DepoBazliStokSatir[]>(`
      SELECT
        d.kod  AS depoKod,
        d.ad   AS depoAd,
        m.kod  AS malzemeKod,
        m.ad   AS malzemeAd,
        CAST(COALESCE(SUM(CASE WHEN t.brut_agirlik IS NOT NULL THEN t.brut_agirlik * t.yon ELSE 0 END), 0) AS FLOAT) AS brutKg,
        CAST(COALESCE(SUM(CASE WHEN t.net_agirlik  IS NOT NULL THEN t.net_agirlik  * t.yon ELSE 0 END), 0) AS FLOAT) AS kg,
        CAST(COALESCE(SUM(CASE WHEN t.brut_metre   IS NOT NULL THEN t.brut_metre   * t.yon ELSE 0 END), 0) AS FLOAT) AS brutMt,
        CAST(COALESCE(SUM(CASE WHEN t.net_metre    IS NOT NULL THEN t.net_metre    * t.yon ELSE 0 END), 0) AS FLOAT) AS mt,
        CAST(COALESCE(SUM(CASE WHEN t.adet         IS NOT NULL THEN t.adet         * t.yon ELSE 0 END), 0) AS INT)    AS adet
      FROM (
        SELECT i.depo_id AS depo_id, k.malzeme_id AS malzeme_id,
          ${irsaliyeYon} AS yon,
          k.brut_agirlik, k.net_agirlik, k.brut_metre, k.net_metre, k.adet
        FROM irsaliye i
        JOIN irsaliye_kalem k ON k.irsaliye_id = i.id
        WHERE i.tamamlandi = 1
          AND k.malzeme_id IS NOT NULL
      ) t
      LEFT JOIN depo d ON d.id = t.depo_id
      LEFT JOIN malzeme m ON m.id = t.malzeme_id
      WHERE t.yon <> 0
      GROUP BY d.kod, d.ad, m.kod, m.ad
      HAVING
        COALESCE(SUM(t.brut_agirlik * t.yon), 0) <> 0 OR
        COALESCE(SUM(t.net_agirlik  * t.yon), 0) <> 0 OR
        COALESCE(SUM(t.brut_metre   * t.yon), 0) <> 0 OR
        COALESCE(SUM(t.net_metre    * t.yon), 0) <> 0 OR
        COALESCE(SUM(t.adet         * t.yon), 0) <> 0
      ORDER BY d.kod, m.kod
    `)

    return rows
  }

  private getTemplateDir(): string {
    return path.join(process.cwd(), '..', 'report_templates')
  }

  async listHtmlTemplates(ekranTuru?: string) {
    const jsonPath = path.join(this.getTemplateDir(), 'templates.json')
    if (!fs.existsSync(jsonPath)) return []
    const raw = fs.readFileSync(jsonPath, 'utf8')
    const templates = JSON.parse(raw) as Array<Record<string, unknown>>
    if (ekranTuru) return templates.filter((t) => t.ekranTuru === ekranTuru)
    return templates
  }

  async getHtmlTemplate(id: string) {
    const templates = await this.listHtmlTemplates()
    const tmpl = templates.find((t) => t.id === id)
    if (!tmpl) throw new NotFoundException('HTML şablonu bulunamadı')
    const htmlPath = path.join(this.getTemplateDir(), tmpl.dosya as string)
    if (!fs.existsSync(htmlPath)) throw new NotFoundException('HTML dosyası bulunamadı: ' + tmpl.dosya)
    const html = fs.readFileSync(htmlPath, 'utf8')
    let logoBase64 = ''
    const logoPath = path.join(this.getTemplateDir(), 'NakosanLogoBase64.txt')
    if (fs.existsSync(logoPath)) {
      logoBase64 = fs.readFileSync(logoPath, 'utf8').trim()
    }
    return { ...tmpl, html, logoBase64 }
  }

  async getHtmlTemplateData(templateId: string, kayitId: number) {
    const tmpl = await this.getHtmlTemplate(templateId)
    const results: Record<string, unknown>[] = []
    for (const s of ((tmpl as Record<string, unknown>).sorgular as Array<Record<string, unknown>>) ?? []) {
      let sql = (s.sorguMetni as string).replace(/;+\s*$/g, '')
      sql = sql.replace(/:id\b/g, String(kayitId))
      const lower = sql.trim().toLowerCase()
      if (!/^(select|with)\b/.test(lower)) {
        throw new BadRequestException('Yalnızca SELECT sorguları çalıştırılabilir.')
      }
      try {
        const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(sql)
        results.push(...rows)
      } catch {
        results.push({})
      }
    }
    return results
  }

  async createHtmlTemplate(input: {
    id: string
    ad: string
    ekranTuru: string
    aciklama?: string
    sayfaBoyut: string
    sayfaYon: string
    genislik: number
    yukseklik: number
  }) {
    const jsonPath = path.join(this.getTemplateDir(), 'templates.json')
    if (!fs.existsSync(jsonPath)) throw new NotFoundException('templates.json bulunamadı')
    const raw = fs.readFileSync(jsonPath, 'utf8')
    const templates = JSON.parse(raw) as Array<Record<string, unknown>>
    if (templates.find((t) => t.id === input.id)) {
      throw new BadRequestException('Bu ID ile bir şablon zaten mevcut')
    }

    const dosyaAdi = input.id.replace(/[^a-z0-9-]/gi, '-') + '.html'
    const htmlIcerik = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #000; background: #fff; }
  .page { width: ${input.genislik}mm; height: ${input.yukseklik}mm; padding: 5mm; position: relative; }

  .header { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 1px solid #ccc; padding-bottom: 3mm; margin-bottom: 3mm; }
  .header-left { display: flex; align-items: center; gap: 5mm; }
  .logo img { height: 20mm; width: auto; }
  .title { font-size: 18px; font-weight: bold; }

  .info-box { border: 1px solid #000; font-size: 9px; }
  .info-box table { border-collapse: collapse; }
  .info-box td { padding: 1mm 2mm; border: 1px solid #000; }
  .info-box .label { font-weight: bold; background: #e0e0e0; width: 20mm; }

  .table-section { margin-top: 3mm; }
  .table-section table { width: 100%; border-collapse: collapse; font-size: 9px; }
  .table-section th { background: #c47a32; color: #fff; font-weight: bold; text-align: left; padding: 2mm; border: 0.5px solid #b06a28; }
  .table-section td { padding: 2mm; border-bottom: 0.5px solid #ddd; }
  .table-section td.right { text-align: right; }

  .footer { position: absolute; bottom: 0; left: 5mm; right: 5mm; display: flex; justify-content: space-between; font-size: 8px; border-top: 1px solid #999; padding-top: 1mm; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-left">
      <div class="logo"><img src="{{logo}}" alt="Logo"></div>
      <div class="title">{{baslik}}</div>
    </div>
    <div class="info-box">
      <table>
        <tr><td class="label">Tarih:</td><td>{{tarih}}</td></tr>
        <tr><td class="label">Fiş No:</td><td>{{fisNo}}</td></tr>
      </table>
    </div>
  </div>

  <div class="table-section">
    <table>
      <thead>
        <tr>
          <th style="width:25%">Kod</th>
          <th style="width:45%">Ad</th>
          <th style="width:15%; text-align:right">Miktar</th>
          <th style="width:15%">Açıklama</th>
        </tr>
      </thead>
      <tbody>
        {{kalemler}}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <span>{{firma}}</span>
    <span>{{bugun}}</span>
  </div>
</div>
</body>
</html>`

    const htmlPath = path.join(this.getTemplateDir(), dosyaAdi)
    fs.writeFileSync(htmlPath, htmlIcerik, 'utf8')

    const yeniSablon = {
      id: input.id,
      ad: input.ad,
      dosya: dosyaAdi,
      ekranTuru: input.ekranTuru,
      aciklama: input.aciklama || '',
      sayfaBoyut: input.sayfaBoyut,
      sayfaYon: input.sayfaYon,
      genislik: input.genislik,
      yukseklik: input.yukseklik,
      sorgular: [
        {
          sirano: 1,
          ad: 'Başlık',
          sorguMetni: "SELECT 'Başlık' AS baslik, GETDATE() AS tarih, '' AS fisNo, '' AS firma",
        },
      ],
    }

    templates.push(yeniSablon)
    fs.writeFileSync(jsonPath, JSON.stringify(templates, null, 2), 'utf8')
    return { success: true, template: yeniSablon }
  }

  async updateHtmlTemplate(id: string, html: string) {
    const templates = await this.listHtmlTemplates()
    const tmpl = templates.find((t) => t.id === id)
    if (!tmpl) throw new NotFoundException('HTML şablonu bulunamadı')
    const htmlPath = path.join(this.getTemplateDir(), tmpl.dosya as string)
    fs.writeFileSync(htmlPath, html, 'utf8')
    return { success: true, dosya: tmpl.dosya }
  }

  async updateHtmlTemplateQueries(id: string, sorgular: Array<{ sirano: number; ad: string; sorguMetni: string }>) {
    const jsonPath = path.join(this.getTemplateDir(), 'templates.json')
    if (!fs.existsSync(jsonPath)) throw new NotFoundException('templates.json bulunamadı')
    const raw = fs.readFileSync(jsonPath, 'utf8')
    const templates = JSON.parse(raw) as Array<Record<string, unknown>>
    const idx = templates.findIndex((t) => t.id === id)
    if (idx === -1) throw new NotFoundException('HTML şablonu bulunamadı')
    templates[idx].sorgular = sorgular
    fs.writeFileSync(jsonPath, JSON.stringify(templates, null, 2), 'utf8')
    return { success: true }
  }
}
