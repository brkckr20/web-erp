import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { auditContext } from './audit-context'

const JWT_SECRET = process.env.JWT_SECRET || 'nakosan-jwt-secret-key-2026'

function parseUserFromRequest(req: any): { kullaniciId?: number; kullaniciAd?: string } {
  // 1. Guard çalıştıysa req.user doludur
  if (req?.user?.id) {
    const u = req.user
    return { kullaniciId: u.id, kullaniciAd: u.ad || u.kullaniciAdi || u.girisKodu || u.kod }
  }
  // 2. Guard yoksa Bearer token'ı manuel çöz (doğrulamasız okuma yok, verify var ama hata yutluyor)
  try {
    const auth: string = req?.headers?.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return {}
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const jwt = require('jsonwebtoken')
    const payload = jwt.verify(token, JWT_SECRET) as any
    return { kullaniciId: payload?.sub, kullaniciAd: payload?.kullaniciAdi }
  } catch {
    return {}
  }
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest()
    const { kullaniciId, kullaniciAd } = parseUserFromRequest(req)
    let ip: string | undefined = req?.ip || req?.headers?.['x-forwarded-for']
    if (typeof ip === 'string' && ip.includes(',')) ip = ip.split(',')[0].trim()
    if (ip === '::1') ip = '127.0.0.1 (yerel)'
    const store = { kullaniciId, kullaniciAd, ip }
    return auditContext.run(store, () => next.handle())
  }
}
