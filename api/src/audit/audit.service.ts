import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

const AUDIT_TABLES = new Set([
  'Siparis',
  'Irsaliye',
  'CariHesap',
  'IsEmri',
  'StokHareketFisi',
  'HizmetTalep',
  'Kullanici',
])

const NO_MAP: Record<string, string> = {
  Siparis: 'siparisNo',
  Irsaliye: 'irsaliyeNo',
  CariHesap: 'kod',
  IsEmri: 'isEmriNo',
  HizmetTalep: 'baslik',
}

function safeJson(v: unknown, max = 4000): string | null {
  if (v == null) return null
  try {
    const s = JSON.stringify(v, (_, val) => (typeof val === 'bigint' ? Number(val) : val?.toString?.().startsWith?.('Decimal') ? String(val) : val))
    return s.length > max ? s.slice(0, max) : s
  } catch {
    return null
  }
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async list(params: { tablo?: string; kullaniciId?: number; from?: string; to?: string; take?: number; skip?: number }) {
    const where: any = {}
    if (params.tablo) where.tablo = params.tablo
    if (params.kullaniciId) where.kullaniciId = params.kullaniciId
    if (params.from || params.to) {
      where.tarih = {}
      if (params.from) where.tarih.gte = new Date(params.from)
      if (params.to) where.tarih.lte = new Date(params.to)
    }
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { tarih: 'desc' },
        take: Math.min(params.take || 100, 500),
        skip: params.skip || 0,
      }),
      this.prisma.auditLog.count({ where }),
    ])
    return { data, total }
  }

  async temizle(gun: number) {
    const sinir = new Date()
    sinir.setDate(sinir.getDate() - gun)
    const res = await this.prisma.auditLog.deleteMany({
      where: { tarih: { lt: sinir } },
    })
    return { deleted: res.count }
  }
}

export { AUDIT_TABLES, NO_MAP, safeJson }
