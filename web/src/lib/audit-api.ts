import { api } from './api'

export interface AuditLog {
  id: number
  tarih: string
  kullaniciId: number | null
  kullaniciAd: string | null
  ip: string | null
  islem: string
  tablo: string
  kayitId: number | null
  kayitNo: string | null
  ozet: string | null
  degisenAlanlar: string | null
  eskiVeri: string | null
  yeniVeri: string | null
}

export const auditApi = {
  list: (params?: { tablo?: string; take?: number; skip?: number; from?: string; to?: string }) => {
    const q = new URLSearchParams()
    if (params?.tablo) q.set('tablo', params.tablo)
    if (params?.take) q.set('take', String(params.take))
    if (params?.skip) q.set('skip', String(params.skip))
    if (params?.from) q.set('from', params.from)
    if (params?.to) q.set('to', params.to)
    const qs = q.toString()
    return api.get<{ data: AuditLog[]; total: number }>(`/audit-log${qs ? `?${qs}` : ''}`)
  },
  temizle: (gun: number) => api.delete<{ deleted: number }>(`/audit-log?gun=${gun}`),
}
