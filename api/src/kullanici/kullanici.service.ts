import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { CreateKullaniciDto, KullaniciSeriDto, KullaniciTasarimDto } from './dto/create-kullanici.dto'
import { UpdateKullaniciDto } from './dto/update-kullanici.dto'

const BELGE_TURLERI = ['E_IRSALIYE', 'E_ARSIV']
const BCRYPT_ROUNDS = 12

async function sifreHazirla(sifre?: string | null): Promise<string | undefined> {
  const deger = String(sifre ?? '').trim()
  if (!deger) return undefined
  if (deger.startsWith('$2')) return deger
  return bcrypt.hash(deger, BCRYPT_ROUNDS)
}

// Şifre (hash) istemciye asla dönmez.
function sifresiz<T extends { sifre?: string | null }>(k: T): Omit<T, 'sifre'> {
  const { sifre, ...rest } = k
  return rest
}

const kullaniciInclude: Prisma.KullaniciInclude = {
  seriler: { orderBy: [{ belgeTuru: 'asc' }, { seri: 'asc' }] },
  tasarimlar: { orderBy: [{ varsayilan: 'desc' }, { sira: 'asc' }, { ad: 'asc' }] },
  roller: { select: { rol: { select: { id: true, ad: true, aktif: true } } } },
}

function seriHazirla(s: KullaniciSeriDto) {
  const belgeTuru = String(s?.belgeTuru ?? '').trim().toUpperCase()
  if (!BELGE_TURLERI.includes(belgeTuru)) {
    throw new BadRequestException('Belge türü E_IRSALIYE veya E_ARSIV olmalıdır')
  }
  const seri = String(s?.seri ?? '').trim().toUpperCase()
  if (!/^[A-Z0-9]{3}$/.test(seri)) {
    throw new BadRequestException('Seri 3 haneli olmalıdır (örn. I01)')
  }
  return { belgeTuru, seri, aktif: s?.aktif !== false }
}

function tasarimHazirla(t: KullaniciTasarimDto, sira: number) {
  const ad = String(t?.ad ?? '').trim()
  const xsltDosyaAdi = String(t?.xsltDosyaAdi ?? '').trim()
  if (!ad) throw new BadRequestException('Tasarım adı zorunludur')
  if (!xsltDosyaAdi) throw new BadRequestException('XSLT dosya adı zorunludur')
  if (xsltDosyaAdi.length > 200) throw new BadRequestException('XSLT dosya adı en fazla 200 karakter olabilir')
  return { ad, xsltDosyaAdi, varsayilan: t?.varsayilan === true, sira, aktif: t?.aktif !== false }
}

function tasarimlariDogrula(tasarimlar: KullaniciTasarimDto[] | undefined) {
  if (!Array.isArray(tasarimlar)) return
  const varsayilanSayisi = tasarimlar.filter((t) => t?.varsayilan === true).length
  if (varsayilanSayisi > 1) {
    throw new BadRequestException('Yalnızca bir tasarım varsayılan olabilir')
  }
}

@Injectable()
export class KullaniciService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const liste = await this.prisma.kullanici.findMany({ orderBy: { kod: 'asc' } })
    return liste.map((k) => sifresiz(k))
  }

  async findOne(id: number) {
    const k = await this.prisma.kullanici.findUnique({ where: { id }, include: kullaniciInclude })
    if (!k) throw new NotFoundException('Kullanıcı bulunamadı')
    return sifresiz(k)
  }

  async findByKod(kod: string) {
    const k = await this.prisma.kullanici.findUnique({ where: { kod }, include: kullaniciInclude })
    if (!k) throw new NotFoundException('Kullanıcı bulunamadı')
    return sifresiz(k)
  }

  async getFavoriler(id: number): Promise<string[]> {
    const k = await this.findOne(id)
    if (!k.favoriler) return []
    try {
      return JSON.parse(k.favoriler)
    } catch {
      return []
    }
  }

  async toggleFavori(id: number, favoriKey: string): Promise<string[]> {
    const k = await this.findOne(id)
    let favoriler: string[] = []
    if (k.favoriler) {
      try {
        favoriler = JSON.parse(k.favoriler)
      } catch {
        favoriler = []
      }
    }
    const index = favoriler.indexOf(favoriKey)
    if (index > -1) {
      favoriler.splice(index, 1)
    } else {
      favoriler.push(favoriKey)
    }
    await this.prisma.kullanici.update({
      where: { id },
      data: { favoriler: JSON.stringify(favoriler) },
    })
    return favoriler
  }

  async create(dto: CreateKullaniciDto) {
    const { seriler, tasarimlar, sifre, rolIdler, ...data } = dto
    const sifreHash = await sifreHazirla(sifre)
    tasarimlariDogrula(tasarimlar)
    const roller = await this.rolIdleriHazirla(rolIdler)
    if (!roller) throw new BadRequestException('En az bir rol seçilmelidir')
    try {
      return await this.prisma.$transaction(async (tx) => {
        const created = await tx.kullanici.create({
          data: { ...data, ...(sifreHash ? { sifre: sifreHash } : {}) },
        })
        if (Array.isArray(seriler)) await this.serileriYaz(tx, created.id, seriler)
        if (Array.isArray(tasarimlar)) await this.tasarimlariYaz(tx, created.id, tasarimlar)
        await this.rolleriYaz(tx, created.id, roller)
        const kayit = await tx.kullanici.findUnique({ where: { id: created.id }, include: kullaniciInclude })
        return kayit ? sifresiz(kayit) : null
      })
    } catch (e) {
      this.hataCevir(e)
    }
  }

  async update(id: number, dto: UpdateKullaniciDto) {
    await this.findOne(id)
    const { seriler, tasarimlar, sifre, rolIdler, ...data } = dto
    const sifreHash = await sifreHazirla(sifre)
    tasarimlariDogrula(tasarimlar)
    const roller = await this.rolIdleriHazirla(rolIdler)
    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.kullanici.update({
          where: { id },
          data: { ...data, ...(sifreHash ? { sifre: sifreHash } : {}) },
        })
        if (Array.isArray(seriler)) await this.serileriYaz(tx, id, seriler)
        if (Array.isArray(tasarimlar)) await this.tasarimlariYaz(tx, id, tasarimlar)
        if (roller) await this.rolleriYaz(tx, id, roller)
        const kayit = await tx.kullanici.findUnique({ where: { id }, include: kullaniciInclude })
        return kayit ? sifresiz(kayit) : null
      })
    } catch (e) {
      this.hataCevir(e)
    }
  }

  async remove(id: number) {
    await this.findOne(id)
    const silinen = await this.prisma.kullanici.delete({ where: { id } })
    return sifresiz(silinen)
  }

  // Numaratör sayaçları korunur: mevcut seri satırı güncellenir, sadece
  // seri kodu değişirse sayaç sıfırlanır. Yeni satırlar 0'dan başlar.
  private async serileriYaz(tx: Prisma.TransactionClient, kullaniciId: number, seriler: KullaniciSeriDto[]) {
    const mevcut = await tx.kullaniciSeri.findMany({ where: { kullaniciId } })
    const gelenIdler = new Set<number>()
    for (const s of seriler) {
      const data = seriHazirla(s)
      const eski = s.id ? mevcut.find((m) => m.id === Number(s.id)) : undefined
      if (eski) {
        gelenIdler.add(eski.id)
        const seriDegisti = eski.seri !== data.seri
        await tx.kullaniciSeri.update({
          where: { id: eski.id },
          data: { ...data, ...(seriDegisti ? { sonSira: 0, sonYil: null } : {}) },
        })
      } else {
        const created = await tx.kullaniciSeri.create({ data: { ...data, kullaniciId } })
        gelenIdler.add(created.id)
      }
    }
    const silinecek = mevcut.filter((m) => !gelenIdler.has(m.id)).map((m) => m.id)
    if (silinecek.length > 0) {
      await tx.kullaniciSeri.deleteMany({ where: { id: { in: silinecek } } })
    }
  }

  private async tasarimlariYaz(tx: Prisma.TransactionClient, kullaniciId: number, tasarimlar: KullaniciTasarimDto[]) {
    await tx.kullaniciTasarim.deleteMany({ where: { kullaniciId } })
    for (let i = 0; i < tasarimlar.length; i++) {
      const t = tasarimlar[i]
      await tx.kullaniciTasarim.create({ data: { ...tasarimHazirla(t, t?.sira ?? i), kullaniciId } })
    }
  }

  // Rolsüz kullanıcı giriş yapamaz; bu yüzden en az bir aktif rol zorunlu.
  private async rolIdleriHazirla(rolIdler?: number[]): Promise<number[] | undefined> {
    if (rolIdler === undefined) return undefined
    const tekil = [...new Set(rolIdler.map(Number).filter((n) => Number.isInteger(n) && n > 0))]
    if (tekil.length === 0) throw new BadRequestException('En az bir rol seçilmelidir')
    const gecerli = await this.prisma.rol.findMany({
      where: { id: { in: tekil }, aktif: true },
      select: { id: true },
    })
    if (gecerli.length !== tekil.length) {
      throw new BadRequestException('Geçersiz veya pasif rol seçimi')
    }
    return tekil
  }

  private async rolleriYaz(tx: Prisma.TransactionClient, kullaniciId: number, rolIdler: number[]) {
    await tx.kullaniciRol.deleteMany({ where: { kullaniciId } })
    await tx.kullaniciRol.createMany({
      data: rolIdler.map((rolId) => ({ kullaniciId, rolId })),
    })
  }

  private hataCevir(e: unknown): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new BadRequestException('Aynı seri (belge türü + seri) başka bir kullanıcıda tanımlı')
    }
    throw e
  }
}
