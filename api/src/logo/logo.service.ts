import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

const LOGOS_DIR = path.join(process.cwd(), '..', 'uploads', 'logos');

// list/getByAd asla `dosya` (Bytes) kolonunu seçmez: JSON yanıtına girmemeli.
const LISTE_SELECT = {
  id: true,
  ad: true,
  dosyaYolu: true,
  mimetype: true,
  boyut: true,
  createdAt: true,
};

@Injectable()
export class LogoService {
  constructor(private prisma: PrismaService) {}

  async list() {
    try {
      return await this.prisma.logo.findMany({
        select: LISTE_SELECT,
        orderBy: { ad: 'asc' },
      });
    } catch {
      return [];
    }
  }

  async getByAd(ad: string) {
    const logo = await this.prisma.logo.findUnique({
      where: { ad },
      select: LISTE_SELECT,
    });
    if (!logo) throw new NotFoundException(`"${ad}" isimli logo bulunamadı`);
    return logo;
  }

  // Sunum için: dosya içeriği DB'de (dosya) veya (eski kayıtlarda) diskte durur.
  async getDosya(ad: string) {
    const logo = await this.prisma.logo.findUnique({
      where: { ad },
      select: { dosya: true, dosyaYolu: true, mimetype: true },
    });
    if (!logo) throw new NotFoundException(`"${ad}" isimli logo bulunamadı`);
    return logo;
  }

  async upload(file: Express.Multer.File, ad: string) {
    if (!file) throw new BadRequestException('Dosya yüklenmedi');
    if (!ad) throw new BadRequestException('Logo adı zorunludur');

    const existing = await this.prisma.logo.findUnique({
      where: { ad },
      select: { id: true },
    });

    const ext = path.extname(file.originalname);
    const data = {
      ad,
      dosyaYolu: `${ad}${ext}`,
      dosya: file.buffer,
      mimetype: file.mimetype,
      boyut: file.size,
    };

    if (existing) {
      return this.prisma.logo.update({ where: { ad }, data });
    }
    return this.prisma.logo.create({ data });
  }

  async remove(id: number) {
    const logo = await this.prisma.logo.findUnique({ where: { id } });
    if (!logo) throw new NotFoundException('Logo bulunamadı');

    // Eski kayıtlarda diskte kalmış olabilir; DB'de olanlarda dosya yoksa zaten atlanır.
    const dosyaYolu = path.join(LOGOS_DIR, logo.dosyaYolu);
    if (fs.existsSync(dosyaYolu)) fs.unlinkSync(dosyaYolu);

    return this.prisma.logo.delete({ where: { id } });
  }

  getFilePath(dosyaYolu: string): string {
    return path.join(LOGOS_DIR, dosyaYolu);
  }
}
