'use client'

import { api } from './api'

export interface KolonKaydi {
  kolonAdi: string
  gizli: boolean
  genislik: number | null
  sira: number | null
  siralamaYon: string | null
}

export const kolonSecimiApi = {
  get: (ekranAdi: string) =>
    api.get<KolonKaydi[]>(`/kolon-secimi/${encodeURIComponent(ekranAdi)}`),

  save: (ekranAdi: string, kolonlar: KolonKaydi[]) =>
    api.post<{ kaydedilen: number }>('/kolon-secimi', { ekranAdi, kolonlar }),
}
