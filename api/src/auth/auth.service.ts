import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
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
    })

    if (!kullanici || !kullanici.durum) {
      throw new UnauthorizedException('Kullanıcı bulunamadı veya pasif')
    }

    if (!kullanici.sifre) {
      throw new UnauthorizedException('Şifre tanımlanmamış')
    }

    if (dto.sifre !== kullanici.sifre) {
      throw new UnauthorizedException('Hatalı şifre')
    }

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
