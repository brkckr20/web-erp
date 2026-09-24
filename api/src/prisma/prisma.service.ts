import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { auditContext } from '../audit/audit-context'

const AUDIT_MODELS = new Set([
  'Siparis',
  'Irsaliye',
  'CariHesap',
  'IsEmri',
  'StokHareketFisi',
  'HizmetTalep',
  'Kullanici',
])

const OP_MAP: Record<string, string> = {
  create: 'OLUSTURDU',
  createMany: 'OLUSTURDU',
  update: 'GUNCELLEDİ',
  updateMany: 'GUNCELLEDİ',
  upsert: 'GUNCELLEDİ',
  delete: 'SİLDİ',
  deleteMany: 'SİLDİ',
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect()
    // @ts-ignore - Prisma $use middleware (v5 uyumlu)
    this.$use(async (params: any, next: any) => {
      // update/delete öncesi eski kaydı yakala (sonrası için)
      let eski: any = null
      try {
        if (
          AUDIT_MODELS.has(params.model) &&
          ['update', 'delete', 'upsert'].includes(params.action) &&
          params.args?.where
        ) {
          const delegate = (this as any)[params.model[0].toLowerCase() + params.model.slice(1)]
          if (delegate?.findUnique) {
            eski = await delegate.findUnique({ where: params.args.where })
          }
        }
      } catch {
        eski = null
      }
      const result = await next(params)
      try {
        if (!AUDIT_MODELS.has(params.model) || !OP_MAP[params.action]) return result
        if (params.model === 'AuditLog') return result
        const ctx = auditContext.getStore() || {}
        const data = params.args?.data
        const where = params.args?.where
        const kayitId = result?.id ?? where?.id ?? eski?.id ?? null
        const kayitNo =
          result?.siparisNo ||
          result?.irsaliyeNo ||
          result?.kod ||
          result?.isEmriNo ||
          result?.baslik ||
          eski?.siparisNo ||
          eski?.irsaliyeNo ||
          eski?.kod ||
          eski?.isEmriNo ||
          eski?.baslik ||
          null
        // değişen alanları eski vs yeni karşılaştırarak bul
        const yeni = result && typeof result === 'object' ? result : data && typeof data === 'object' ? data : {}
        const farklar: string[] = []
        if (eski && yeni) {
          for (const key of Object.keys(data && typeof data === 'object' ? data : yeni)) {
            if (['updatedAt', 'guncellemeTarihi'].includes(key)) continue
            const e = eski[key]
            const y = (yeni as any)[key] ?? (data as any)?.[key]
            const es = e == null ? 'boş' : String(e).slice(0, 50)
            const ys = y == null ? 'boş' : String(y).slice(0, 50)
            if (es !== ys) farklar.push(`${key}: ${es} → ${ys}`)
          }
        }
        const islem = OP_MAP[params.action]
        const ozet =
          farklar.length > 0
            ? `${params.model} ${islem}${kayitNo ? ` (${kayitNo})` : ''} — ${farklar.slice(0, 5).join(', ')}`
            : `${params.model} ${islem}${kayitNo ? ` (${kayitNo})` : ''}`
        await (this as any).auditLog.create({
          data: {
            kullaniciId: ctx.kullaniciId ?? null,
            kullaniciAd: ctx.kullaniciAd ?? null,
            ip: ctx.ip ?? null,
            islem,
            tablo: params.model,
            kayitId: typeof kayitId === 'number' ? kayitId : null,
            kayitNo: kayitNo ? String(kayitNo) : null,
            ozet,
            degisenAlanlar: farklar.length > 0 ? JSON.stringify(farklar).slice(0, 4000) : data ? JSON.stringify(Object.keys(data)).slice(0, 4000) : null,
            eskiVeri: eski ? JSON.stringify(eski).slice(0, 4000) : null,
            yeniVeri: (result ?? data) ? JSON.stringify(result ?? data).slice(0, 4000) : null,
          },
        })
      } catch {
        // audit yazımı asla işi patlatmaz
      }
      return result
    })
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
