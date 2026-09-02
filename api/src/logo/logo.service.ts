import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import * as fs from 'fs'
import * as path from 'path'

const LOGOS_DIR = path.join(process.cwd(), '..', 'uploads', 'logos')

@Injectable()
export class LogoService {
  constructor(private prisma: PrismaService) {}

  private ensureDir() {
    if (!fs.existsSync(LOGOS_DIR)) {
      fs.mkdirSync(LOGOS_DIR, { recursive: true })
    }
  }

  async list() {
    return this.prisma.logo.findMany({ orderBy: { ad: 'asc' } })
  }

  async getByAd(ad: string) {
    const logo = await this.prisma.logo.findUnique({ where: { ad } })
    if (!logo) throw new NotFoundException(`"${ad}" isimli logo bulunamadı`)
    return logo
  }

  async upload(file: Express.Multer.File, ad: string) {
    if (!file) throw new BadRequestException('Dosya yüklenmedi')
    if (!ad) throw new BadRequestException('Logo adı zorunludur')

    const existing = await this.prisma.logo.findUnique({ where: { ad } })
    if (existing) {
      const oldPath = path.join(LOGOS_DIR, existing.dosyaYolu)
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
    }

    this.ensureDir()
    const ext = path.extname(file.originalname)
    const dosyaAdi = `${ad}${ext}`
    const dosyaYolu = path.join(LOGOS_DIR, dosyaAdi)

    fs.writeFileSync(dosyaYolu, file.buffer)

    const data = {
      ad,
      dosyaYolu: dosyaAdi,
      mimetype: file.mimetype,
      boyut: file.size,
    }

    if (existing) {
      return this.prisma.logo.update({ where: { ad }, data })
    }
    return this.prisma.logo.create({ data })
  }

  async remove(id: number) {
    const logo = await this.prisma.logo.findUnique({ where: { id } })
    if (!logo) throw new NotFoundException('Logo bulunamadı')

    const dosyaYolu = path.join(LOGOS_DIR, logo.dosyaYolu)
    if (fs.existsSync(dosyaYolu)) fs.unlinkSync(dosyaYolu)

    return this.prisma.logo.delete({ where: { id } })
  }

  getFilePath(dosyaYolu: string): string {
    return path.join(LOGOS_DIR, dosyaYolu)
  }
}
