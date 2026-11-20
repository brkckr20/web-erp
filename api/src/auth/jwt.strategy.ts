import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { PrismaService } from '../prisma/prisma.service'
import { JWT_SECRET } from './jwt-secret'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    })
  }

  async validate(payload: { sub: number; kullaniciAdi: string }) {
    const kullanici = await this.prisma.kullanici.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        kod: true,
        girisKodu: true,
        ad: true,
        durum: true,
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
      throw new UnauthorizedException()
    }
    const aktifRoller = kullanici.roller.map((r) => r.rol).filter((r) => r.aktif)
    return {
      id: kullanici.id,
      kod: kullanici.kod,
      girisKodu: kullanici.girisKodu,
      ad: kullanici.ad,
      roller: aktifRoller.map((r) => r.ad),
      izinler: [...new Set(aktifRoller.flatMap((r) => r.izinler.map((i) => i.izin.kod)))],
    }
  }
}
