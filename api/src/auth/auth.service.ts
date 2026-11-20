import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const kullanici = await this.prisma.kullanici.findFirst({
      where: {
        OR: [
          { girisKodu: dto.kullaniciAdi },
          { kod: dto.kullaniciAdi },
        ],
      },
      include: {
        roller: {
          select: {
            rol: {
              select: {
                ad: true,
                aktif: true,
                izinler: { select: { izin: { select: { kod: true } } } },
              },
            },
          },
        },
      },
    })

    if (!kullanici || !kullanici.durum) {
      throw new UnauthorizedException('Kullanıcı bulunamadı veya pasif')
    }

    if (!kullanici.sifre) {
      throw new UnauthorizedException('Şifre tanımlanmamış')
    }

    const hashli = kullanici.sifre.startsWith('$2')
    const sifreGecerli = hashli
      ? await bcrypt.compare(dto.sifre, kullanici.sifre)
      : dto.sifre === kullanici.sifre
    if (!sifreGecerli) {
      throw new UnauthorizedException('Hatalı şifre')
    }

    // Düz metin kayıtları ilk başarılı girişte hash'e çevir (geçiş dönemi).
    if (!hashli) {
      await this.prisma.kullanici.update({
        where: { id: kullanici.id },
        data: { sifre: await bcrypt.hash(dto.sifre, 12) },
      })
    }

    const aktifRoller = kullanici.roller.map((r) => r.rol).filter((r) => r.aktif)
    if (aktifRoller.length === 0) {
      throw new UnauthorizedException('Kullanıcıya rol atanmamış')
    }
    const roller = aktifRoller.map((r) => r.ad)
    const izinler = [...new Set(aktifRoller.flatMap((r) => r.izinler.map((i) => i.izin.kod)))]

    const payload = { sub: kullanici.id, kullaniciAdi: kullanici.girisKodu || kullanici.kod }

    return {
      accessToken: this.jwtService.sign(payload, {
        expiresIn: (dto.beniHatirlat ? '30d' : process.env.JWT_EXPIRES_IN || '12h') as any,
      }),
      kullanici: {
        id: kullanici.id,
        kod: kullanici.kod,
        girisKodu: kullanici.girisKodu,
        ad: kullanici.ad,
        roller,
        izinler,
      },
    }
  }

  async kullanicilar() {
    return this.prisma.kullanici.findMany({
      where: { durum: true },
      select: {
        id: true,
        kod: true,
        girisKodu: true,
        ad: true,
      },
      orderBy: { kod: 'asc' },
    })
  }
}
