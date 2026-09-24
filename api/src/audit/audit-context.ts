import { AsyncLocalStorage } from 'async_hooks'

export interface AuditContext {
  kullaniciId?: number
  kullaniciAd?: string
  ip?: string
}

export const auditContext = new AsyncLocalStorage<AuditContext>()
