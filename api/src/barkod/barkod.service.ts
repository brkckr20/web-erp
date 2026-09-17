import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateBarkodDto } from './dto/create-barkod.dto'

@Injectable()
export class BarkodService {
  constructor(private prisma: PrismaService) {}

  private generateKod(): string {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  private async uniqueKod(): Promise<string> {
    let kod: string
    let exists: boolean
    do {
      kod = this.generateKod()
      const row = await this.prisma.barkodEslesme.findUnique({ where: { barkodKodu: kod } })
      exists = !!row
    } while (exists)
    return kod
  }

  async findAll(siparisNo?: string) {
    const where: any = {}
    if (siparisNo) where.siparisNo = siparisNo
    return this.prisma.barkodEslesme.findMany({
      where,
      orderBy: { olusturmaTarihi: 'desc' },
    })
  }

  async findOne(id: number) {
    const barkod = await this.prisma.barkodEslesme.findUnique({ where: { id } })
    if (!barkod) throw new NotFoundException('Barkod eşleşmesi bulunamadı')
    return barkod
  }

  async findByKod(barkodKodu: string) {
    const barkod = await this.prisma.barkodEslesme.findUnique({
      where: { barkodKodu },
    })
    if (!barkod) throw new NotFoundException(`Barkod bulunamadı: ${barkodKodu}`)
    return barkod
  }

  async parseAndLookup(tamBarkod: string) {
    // Format: IH26-0001|#|a3f7k2
    const parts = tamBarkod.split('|#|')
    if (parts.length < 2) {
      throw new BadRequestException('Geçersiz barkod formatı. Beklenen: SIPARIS_NO|#|KISA_KOD')
    }

    const siparisNo = parts[0].trim()
    const barkodKodu = parts[1].trim()

    const eslesme = await this.prisma.barkodEslesme.findFirst({
      where: {
        siparisNo,
        barkodKodu,
      },
    })

    if (!eslesme) {
      throw new NotFoundException(`Barkod bulunamadı: ${tamBarkod}`)
    }

    return eslesme
  }

  async create(dto: CreateBarkodDto) {
    const barkodKodu = await this.uniqueKod()

    return this.prisma.barkodEslesme.create({
      data: {
        barkodKodu,
        siparisNo: dto.siparisNo,
        modelKod: dto.modelKod,
        renkKod: dto.renkKod,
        beden: dto.beden,
        kumasKod: dto.kumasKod,
        kumasRenkKod: dto.kumasRenkKod,
        modelAd: dto.modelAd ?? null,
        renkAd: dto.renkAd ?? null,
        kumasAd: dto.kumasAd ?? null,
        kumasRenkAd: dto.kumasRenkAd ?? null,
      },
    })
  }

  async createBatch(dtos: CreateBarkodDto[]) {
    const results: any[] = []
    for (const dto of dtos) {
      const result = await this.create(dto)
      results.push(result)
    }
    return results
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.barkodEslesme.delete({ where: { id } })
  }

  async removeBySiparis(siparisNo: string) {
    return this.prisma.barkodEslesme.deleteMany({ where: { siparisNo } })
  }

  async uret(siparisId: number) {
    const siparis = await this.prisma.siparis.findUnique({
      where: { id: siparisId },
      include: {
        kalemler: {
          include: {
            malzeme: true,
            renkler: {
              include: {
                kumasGruplari: {
                  include: {
                    kumasGrup: true,
                    renk: true,
                  },
                },
                bedenler: {
                  include: {
                    beden: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!siparis) throw new NotFoundException('Sipariş bulunamadı')

    // Mevcut barkodları temizle
    await this.prisma.barkodEslesme.deleteMany({ where: { siparisNo: siparis.siparisNo } })

    const olusturulanlar: any[] = []

    for (const kalem of siparis.kalemler) {
      const modelKod = kalem.malzeme?.kod ?? ''
      const modelAd = kalem.malzeme?.ad ?? ''
      if (!modelKod) continue

      for (const renk of kalem.renkler) {
        // Renk grubu başına tek barkod: grubun ilk kumaşının rengi temsilci olur.
        // Beden yok — operatör okutma sonrası beden adetlerini elle girer.
        const ilkKumas = renk.kumasGruplari[0]
        const kumasKod = ilkKumas?.kumasGrup?.kod ?? ''
        const kumasRenkKod = ilkKumas?.renk?.kod ?? ''
        const kumasRenkAd = ilkKumas?.renk?.ad ?? ''
        const renkKod = kumasRenkKod || kumasKod

        const barkodKodu = await this.uniqueKod()

        const eslesme = await this.prisma.barkodEslesme.create({
          data: {
            barkodKodu,
            siparisNo: siparis.siparisNo,
            modelKod,
            renkKod,
            beden: '',
            kumasKod,
            kumasRenkKod,
            modelAd,
            renkAd: kumasRenkAd || null,
            kumasAd: ilkKumas?.kumasGrup?.kod ?? null,
            kumasRenkAd: kumasRenkAd || null,
          },
        })

        olusturulanlar.push({
          ...eslesme,
          tamBarkod: `${siparis.siparisNo}|#|${barkodKodu}`,
        })
      }
    }

    return {
      siparisNo: siparis.siparisNo,
      toplam: olusturulanlar.length,
      barkodlar: olusturulanlar,
    }
  }
}
