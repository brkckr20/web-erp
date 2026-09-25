import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateMalzemeDto } from './dto/create-malzeme.dto'
import { UpdateMalzemeDto } from './dto/update-malzeme.dto'

@Injectable()
export class MalzemeService {
  constructor(private prisma: PrismaService) {}

  private includeUretici = {
    kumasTuru: true,
    aksesuarTipi: true,
    markaRef: true,
    ureticiFirma: { select: { id: true, kod: true, ad: true } },
  }

  private formatResult(m: any) {
    const { ureticiFirma, ...rest } = m
    return { ...rest, cariAdi: ureticiFirma?.ad ?? null }
  }

  async findAll(tip?: number) {
    const where = tip != null ? { tip } : undefined
    const list = await this.prisma.malzeme.findMany({
      where,
      include: this.includeUretici,
      orderBy: { kod: 'asc' },
    })
    return list.map(this.formatResult)
  }

  async findOne(id: number) {
    const m = await this.prisma.malzeme.findUnique({
      where: { id },
      include: this.includeUretici,
    })
    if (!m) throw new NotFoundException('Malzeme bulunamadı')
    return this.formatResult(m)
  }

  async findByKod(kod: string) {
    const m = await this.prisma.malzeme.findUnique({
      where: { kod },
      include: this.includeUretici,
    })
    if (!m) throw new NotFoundException('Malzeme bulunamadı')
    return this.formatResult(m)
  }

  async nextKod(numaratorId: number) {
    const num = await this.prisma.numarator.findUnique({ where: { id: numaratorId } })
    if (!num) throw new NotFoundException('Numaratör bulunamadı')
    if (!num.kullanimda) throw new BadRequestException('Numaratör kullanımda değil')

    const yeniNo = num.sonNo + 1
    const kod = `${num.onEk}${String(yeniNo).padStart(3, '0')}`

    await this.prisma.numarator.update({
      where: { id: numaratorId },
      data: { sonNo: yeniNo },
    })

    return { kod }
  }

  private prepareData(data: any) {
    delete data.id
    delete data.createdAt
    delete data.updatedAt
    delete data.cariAdi
    delete data.ureticiFirma
    delete data.barkod
    delete data.kalemler
    delete data.isEmriKalemler
    delete data.kkKalemler
    delete data.receteler
    delete data.receteKalemler
    delete data.malzemeBedenler
    delete data.malzemeKumasGruplari
    delete data.markaRef
    delete data.grup
    delete data.kumasTuru
    delete data.numarator
    delete data.iplikNoRef
    delete data.iplikCinsiRef
    delete data.iplikKompozisyonRef
    delete data.aksesuarTipi
    // boş string FK patlatır → null yap (alan zorunlu değil)
    if (data.ureticiFirmaKodu != null && String(data.ureticiFirmaKodu).trim() === '') {
      data.ureticiFirmaKodu = null
    }
    return data
  }

  private async ureticiKoduKontrol(kod: string | null | undefined) {
    if (kod == null) return
    const cari = await this.prisma.cariHesap.findUnique({ where: { kod }, select: { id: true } })
    if (!cari) {
      throw new BadRequestException(`"${kod}" cari kodu bulunamadı. Önce cari kartı açın veya alanı boş bırakın.`)
    }
  }

  async create(dto: CreateMalzemeDto) {
    const data = this.prepareData(dto as any)
    await this.ureticiKoduKontrol(data.ureticiFirmaKodu)
    return this.prisma.malzeme.create({
      data: { ...data, kayitYapan: (dto as any).kayitYapan || null },
    })
  }

  async update(id: number, dto: UpdateMalzemeDto) {
    await this.findOne(id)
    const data = this.prepareData(dto as any)
    await this.ureticiKoduKontrol(data.ureticiFirmaKodu)
    return this.prisma.malzeme.update({ where: { id }, data })
  }

  async remove(id: number) {
    const malzeme = await this.findOne(id)
    const [siparisSayi, irsaliyeSayi, isEmriSayi, receteSayi, siparisler] = await Promise.all([
      this.prisma.siparisKalem.count({ where: { malzemeId: id } }),
      this.prisma.irsaliyeKalem.count({ where: { malzemeId: id } }),
      this.prisma.isEmriKalem.count({ where: { malzemeId: id } }),
      this.prisma.receteKalem.count({ where: { malzemeId: id } }),
      this.prisma.siparisKalem.findMany({
        where: { malzemeId: id },
        select: { siparis: { select: { siparisNo: true } } },
        take: 5,
      }),
    ])
    const kullanimlar: string[] = []
    if (siparisSayi > 0) {
      const nolar = [...new Set(siparisler.map((s) => s.siparis?.siparisNo).filter(Boolean))].slice(0, 5)
      kullanimlar.push(
        `${siparisSayi} sipariş kalemi${nolar.length > 0 ? ` (${nolar.join(', ')}${siparisSayi > nolar.length ? ', ...' : ''})` : ''}`,
      )
    }
    if (irsaliyeSayi > 0) kullanimlar.push(`${irsaliyeSayi} irsaliye kalemi`)
    if (isEmriSayi > 0) kullanimlar.push(`${isEmriSayi} iş emri kalemi`)
    if (receteSayi > 0) kullanimlar.push(`${receteSayi} reçete kalemi`)
    if (kullanimlar.length > 0) {
      throw new BadRequestException(
        `"${malzeme.kod}" silinemez, kullanımda: ${kullanimlar.join(', ')}. Önce ilgili kayıtları silin veya kartı pasife alın.`,
      )
    }
    try {
      return await this.prisma.malzeme.delete({ where: { id } })
    } catch (e: any) {
      if (e?.code === 'P2003') {
        throw new BadRequestException(
          `"${malzeme.kod}" silinemez, başka kayıtlarda kullanılıyor. Önce ilgili kayıtları silin veya kartı pasife alın.`,
        )
      }
      throw e
    }
  }
}
