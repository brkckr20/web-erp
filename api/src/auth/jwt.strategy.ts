import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'nakosan-jwt-secret-key-2026',
    })
  }

  async validate(payload: { sub: number; kullaniciAdi: string }) {
    const kullanici = await this.prisma.kullanici.findUnique({
      where: { id: payload.sub },
      select: { id: true, kod: true, girisKodu: true, ad: true, durum: true },
    })
    if (!kullanici || !kullanici.durum) {
      throw new UnauthorizedException()
    }
    return kullanici
  }
}
