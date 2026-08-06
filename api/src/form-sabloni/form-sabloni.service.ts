import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateFormSabloniDto } from './dto/create-form-sabloni.dto'
import { UpdateFormSabloniDto } from './dto/update-form-sabloni.dto'

interface TasarimData {
  sorgular: unknown[]
  layout: unknown[]
  sayfa: unknown
}

@Injectable()
export class FormSabloniService {
  constructor(private prisma: PrismaService) {}

  async findAll(ekranTuru?: string) {
    const rows = await this.prisma.formSabloni.findMany({
      where: ekranTuru ? { ekranTuru } : undefined,
      orderBy: { updatedAt: 'desc' },
    })
    return rows.map((r) => {
      const tasarim = this.parseTasarim(r.layoutJson)
      return {
        id: r.id,
        kod: r.kod,
        ad: r.ad,
        ekranTuru: r.ekranTuru,
        sorguSayisi: tasarim.sorgular.length,
        bandSayisi: tasarim.layout.length,
        aktif: r.aktif,
        updatedAt: r.updatedAt,
      }
    })
  }

  async findOne(id: number) {
    const row = await this.prisma.formSabloni.findUnique({ where: { id } })
    if (!row) throw new NotFoundException('Form şablonu bulunamadı')
    const tasarim = this.parseTasarim(row.layoutJson)
    return {
      id: row.id,
      kod: row.kod,
      ad: row.ad,
      ekranTuru: row.ekranTuru,
      aktif: row.aktif,
      ...tasarim,
    }
  }

  async create(dto: CreateFormSabloniDto) {
    const row = await this.prisma.formSabloni.create({
      data: {
        kod: dto.kod,
        ad: dto.ad,
        ekranTuru: dto.ekranTuru,
        layoutJson: this.serializeTasarim(dto),
        aktif: dto.aktif ?? true,
      },
    })
    return { id: row.id }
  }

  async update(id: number, dto: UpdateFormSabloniDto) {
    await this.findOne(id)
    const data: Record<string, unknown> = {}
    if (dto.kod !== undefined) data.kod = dto.kod
    if (dto.ad !== undefined) data.ad = dto.ad
    if (dto.ekranTuru !== undefined) data.ekranTuru = dto.ekranTuru
    if (dto.aktif !== undefined) data.aktif = dto.aktif
    if (dto.sorgular !== undefined || dto.layout !== undefined || dto.sayfa !== undefined) {
      data.layoutJson = this.serializeTasarim(dto)
    }
    await this.prisma.formSabloni.update({ where: { id }, data })
    return { id }
  }

  async remove(id: number) {
    await this.findOne(id)
    await this.prisma.formSabloni.delete({ where: { id } })
    return { id }
  }

  async sorguTest(sorguMetni: string, parametreler: Record<string, unknown> = {}) {
    const trimmed = sorguMetni.trim()
    const lower = trimmed.toLowerCase()
    if (!/^(select|with)\b/.test(lower)) {
      throw new BadRequestException('Yalnızca SELECT (veya WITH) sorguları çalıştırılabilir.')
    }
    const sql = trimmed
      .replace(/;+\s*$/g, '')
      .replace(/:([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (_, ad: string) => {
        if (!(ad in parametreler)) throw new BadRequestException(`:${ad} parametresi verilmedi.`)
        const v = parametreler[ad]
        if (typeof v === 'number') return String(v)
        if (typeof v === 'boolean') return v ? '1' : '0'
        return `N'${String(v).replace(/'/g, "''")}'`
      })
    let rows: Record<string, unknown>[]
    try {
      rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(sql)
    } catch (e) {
      throw new BadRequestException(`Sorgu çalışmadı: ${e instanceof Error ? e.message : 'bilinmeyen hata'}`)
    }
    const kolonlar = rows.length > 0 ? Object.keys(rows[0]) : []
    return { kolonlar, satirlar: rows.slice(0, 50) }
  }

  private parseTasarim(json: string): TasarimData {
    try {
      const parsed = JSON.parse(json) as Partial<TasarimData>
      return {
        sorgular: Array.isArray(parsed.sorgular) ? parsed.sorgular : [],
        layout: Array.isArray(parsed.layout) ? parsed.layout : [],
        sayfa: parsed.sayfa ?? {},
      }
    } catch {
      return { sorgular: [], layout: [], sayfa: {} }
    }
  }

  private serializeTasarim(dto: Partial<CreateFormSabloniDto>): string {
    const tasarim: TasarimData = {
      sorgular: dto.sorgular ?? [],
      layout: dto.layout ?? [],
      sayfa: dto.sayfa ?? {},
    }
    return JSON.stringify(tasarim)
  }
}
