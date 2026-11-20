import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { IZIN_KEY } from './izin.decorator'
import { IS_PUBLIC_KEY } from './public.decorator'

@Injectable()
export class IzinGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    const gerekli = this.reflector.getAllAndOverride<string[]>(IZIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!gerekli || gerekli.length === 0) return true

    const user = context.switchToHttp().getRequest().user
    const izinler: string[] = Array.isArray(user?.izinler) ? user.izinler : []
    if (izinler.length === 0) {
      throw new ForbiddenException('Kullanıcıya rol atanmamış')
    }
    if (!gerekli.some((kod) => izinler.includes(kod))) {
      throw new ForbiddenException('Bu işlem için yetkiniz yok')
    }
    return true
  }
}
