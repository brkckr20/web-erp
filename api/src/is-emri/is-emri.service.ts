import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateIsEmriDto } from './dto/create-is-emri.dto'
import { UpdateIsEmriDto } from './dto/update-is-emri.dto'

@Injectable()
export class IsEmriService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const items = await this.prisma.isEmri.findMany({
      orderBy: { isEmriNo: 'asc' },
      include: { kalemler: { orderBy: { sira: 'asc' } } },
    })

    const kkGrouped = await this.prisma.kaliteKontrolKalem.groupBy({
      by: ['isEmriNo', 'malzemeId'],
      _sum: { netAgirlik: true, netMetre: true, adet: true },
      where: { isEmriNo: { not: null }, malzemeId: { not: null } },
    })

    const malzemeIds = [...new Set(kkGrouped.map((k) => k.malzemeId).filter(Boolean) as number[])]
    const malzemeler = malzemeIds.length > 0
      ? await this.prisma.malzeme.findMany({ where: { id: { in: malzemeIds } }, select: { id: true, kod: true } })
      : []
    const malzemeMap = new Map(malzemeler.map((m) => [m.id, m.kod]))

    const kkMapKg = new Map<string, number>()
    const kkMapMt = new Map<string, number>()
    const kkMapAdet = new Map<string, number>()
    for (const k of kkGrouped) {
      const malzemeKod = malzemeMap.get(k.malzemeId!) ?? ''
      if (!malzemeKod) continue
      const key = `${k.isEmriNo}|${malzemeKod}`
      kkMapKg.set(key, Number(k._sum.netAgirlik) || 0)
      kkMapMt.set(key, Number(k._sum.netMetre) || 0)
      kkMapAdet.set(key, Number(k._sum.adet) || 0)
    }

    for (const isEmri of items) {
      for (const kalem of isEmri.kalemler) {
        const key = `${isEmri.isEmriNo}|${kalem.malzemeKod}`
        ;(kalem as any).kullanilanKg = kkMapKg.get(key) ?? 0
        ;(kalem as any).kullanilanMt = kkMapMt.get(key) ?? 0
        ;(kalem as any).kullanilanAdet = kkMapAdet.get(key) ?? 0
      }
    }

    return items
  }

  async findOne(id: number) {
    const entity = await this.prisma.isEmri.findUnique({
      where: { id },
      include: { kalemler: { include: { malzeme: true }, orderBy: { sira: 'asc' } } },
    })
    if (!entity) throw new NotFoundException('İş emri bulunamadı')
    return entity
  }

  async findByKod(kod: string) {
    const entity = await this.prisma.isEmri.findUnique({
      where: { isEmriNo: kod },
      include: { kalemler: { include: { malzeme: true }, orderBy: { sira: 'asc' } } },
    })
    if (!entity) throw new NotFoundException('İş emri bulunamadı')
    return entity
  }

  async create(dto: CreateIsEmriDto) {
    const hazirKalemler = this.kalemlerHazirla(dto.kalemler)
    const data: any = { ...dto }
    delete data.kalemler
    delete data.isEmriNo
    if (dto.baslangicTarihi) data.baslangicTarihi = new Date(dto.baslangicTarihi)
    if (dto.bitisTarihi) data.bitisTarihi = new Date(dto.bitisTarihi)

    // Numara üretimi ile kayıt arasında başka bir kayıt aynı numarayı alabilir;
    // unique ihlalinde (P2002) taze numara üretip yeniden denenir.
    for (let deneme = 0; ; deneme++) {
      const isEmriNo = await this.generateIsEmriNo()
      try {
        return await this.prisma.isEmri.create({
          data: {
            ...data,
            isEmriNo,
            kalemler: {
              create: hazirKalemler.map(({ id: _id, ...k }) => k),
            },
          },
          include: { kalemler: { orderBy: { sira: 'asc' } } },
        })
      } catch (e) {
        if ((e as any)?.code === 'P2002' && deneme < 3) continue
        throw e
      }
    }
  }

  async update(id: number, dto: UpdateIsEmriDto) {
    // Kalemler gönderilmediyse mevcut satırlara dokunulmaz.
    const hazirKalemler = Array.isArray(dto.kalemler) ? this.kalemlerHazirla(dto.kalemler) : null
    const data: any = { ...dto }
    delete data.kalemler
    delete data.isEmriNo
    if (dto.baslangicTarihi) data.baslangicTarihi = new Date(dto.baslangicTarihi)
    if (dto.bitisTarihi) data.bitisTarihi = new Date(dto.bitisTarihi)

    // Kalemler id eşleşmesiyle YERİNDE güncellenir; yalnızca payload'da
    // olmayanlar silinir. Böylece hata durumunda satırlar kaybolmaz.
    return this.prisma.$transaction(async (tx) => {
      const mevcut = await tx.isEmri.findUnique({ where: { id }, select: { id: true } })
      if (!mevcut) throw new NotFoundException('İş emri bulunamadı')

      await tx.isEmri.update({ where: { id }, data })

      if (hazirKalemler) {
        const eskiler = await tx.isEmriKalem.findMany({
          where: { isEmriId: id },
          select: { id: true },
        })
        const eskiIdler = new Set(eskiler.map((e) => e.id))
        const korunan: number[] = []

        for (const k of hazirKalemler) {
          const { id: kalemId, ...kalemData } = k
          if (kalemId && eskiIdler.has(kalemId)) {
            await tx.isEmriKalem.update({ where: { id: kalemId }, data: kalemData })
            korunan.push(kalemId)
          } else {
            const olusan = await tx.isEmriKalem.create({
              data: { ...kalemData, isEmriId: id },
            })
            korunan.push(olusan.id)
          }
        }

        const silinecek = eskiler.filter((e) => !korunan.includes(e.id)).map((e) => e.id)
        if (silinecek.length > 0) {
          await tx.isEmriKalem.deleteMany({ where: { id: { in: silinecek } } })
        }
      }

      return tx.isEmri.findUnique({
        where: { id },
        include: { kalemler: { orderBy: { sira: 'asc' } } },
      })
    })
  }

  private kalemlerHazirla(kalemler?: CreateIsEmriDto['kalemler']) {
    const rows = (kalemler ?? []).map((k, i) => ({
      id: k.id && k.id > 0 ? k.id : null,
      sira: k.sira ?? i,
      siparisNo: k.siparisNo ?? null,
      malzemeId: k.malzemeId ?? null,
      malzemeKod: k.malzemeKod ?? null,
      malzemeAd: k.malzemeAd ?? null,
      kg: k.kg ?? null,
      mt: k.mt ?? null,
      adet: k.adet ?? null,
    }))

    for (const k of rows) {
      for (const [alan, deger] of [
        ['Kg', k.kg],
        ['Mt', k.mt],
        ['Adet', k.adet],
      ] as const) {
        if (deger != null && Number(deger) < 0) {
          throw new BadRequestException(`${k.malzemeKod ?? 'Satır'}: ${alan} negatif olamaz.`)
        }
      }
    }

    // Aynı malzeme iki satırda yer alırsa tüketim iki kez sayılır; engelle.
    const malzemeIdler = rows.map((k) => k.malzemeId).filter((v): v is number => v != null)
    if (new Set(malzemeIdler).size !== malzemeIdler.length) {
      throw new BadRequestException('Aynı malzeme birden fazla satırda yer alamaz.')
    }

    return rows
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.$transaction(async (tx) => {
      await tx.kaliteKontrol.updateMany({ where: { isEmriId: id }, data: { isEmriId: null } })
      return tx.isEmri.delete({ where: { id } })
    })
  }

  private async generateIsEmriNo(): Promise<string> {
    const PREFIX = 'IE-'
    const all = await this.prisma.isEmri.findMany({
      where: { isEmriNo: { startsWith: PREFIX } },
      select: { isEmriNo: true },
    })

    let max = 0
    for (const row of all) {
      const numStr = (row.isEmriNo ?? '').replace(PREFIX, '').replace(/\D/g, '')
      const parsed = parseInt(numStr, 10)
      if (!isNaN(parsed) && parsed > max) max = parsed
    }
    return `${PREFIX}${String(max + 1).padStart(8, '0')}`
  }
}
