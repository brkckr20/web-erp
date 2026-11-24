import { api } from './api'

export interface MuhasebeEntegrasyonTanimi {
  id?: number
  hesapTipi: string
  faturaTipi: string | null
  depoId: number | null
  fasonTipiId: number | null
  kdvOrani: number | string | null
  muhasebeHesapId: number | null
  hesapKodu: string
  sira: number
  aktif: boolean
  depo?: { id: number; kod: string; ad: string } | null
  fasonTipi?: { id: number; ad: string } | null
  muhasebeHesap?: { id: number; kod: string; ad: string } | null
}

export const muhasebeEntegrasyonApi = {
  list: () => api.get<MuhasebeEntegrasyonTanimi[]>('/muhasebe-entegrasyon'),
  replaceAll: (items: MuhasebeEntegrasyonTanimi[]) =>
    api.put<MuhasebeEntegrasyonTanimi[]>('/muhasebe-entegrasyon', { items }),
}
