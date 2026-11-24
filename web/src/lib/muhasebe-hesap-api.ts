import { api } from './api'

export type HesapTipi = 'PARASAL' | 'PARASAL_OLMAYAN_BORC' | 'PARASAL_OLMAYAN_ALACAK'
export type HesapTuru = 'BORC_ALACAK' | 'BORC' | 'ALACAK'

export interface MuhasebeHesap {
  id: number
  kod: string
  ad: string
  erisimKodu: string | null
  ozelKod: string | null
  aciklama: string | null
  hesapTipi: HesapTipi
  hesapTuru: HesapTuru
}

export interface MuhasebeHesapFormData {
  kod: string
  ad: string
  erisimKodu?: string | null
  ozelKod?: string | null
  aciklama?: string | null
  hesapTipi?: HesapTipi
  hesapTuru?: HesapTuru
}

export const muhasebeHesapApi = {
  list: () => api.get<MuhasebeHesap[]>('/muhasebe-hesap'),
  getById: (id: number) => api.get<MuhasebeHesap>(`/muhasebe-hesap/${id}`),
  create: (data: MuhasebeHesapFormData) => api.post<MuhasebeHesap>('/muhasebe-hesap', data),
  update: (id: number, data: Partial<MuhasebeHesapFormData>) =>
    api.put<MuhasebeHesap>(`/muhasebe-hesap/${id}`, data),
  remove: (id: number) => api.delete<void>(`/muhasebe-hesap/${id}`),
  import: (satirlar: Record<string, unknown>[]) =>
    api.post<{ toplam: number; eklenen: number; atlanan: { kod: string; neden: string }[] }>('/muhasebe-hesap/import', { satirlar }),
}
