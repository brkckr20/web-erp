import { api } from './api'

export interface MuhasebeFisSatir {
  id?: number
  hesapKodu: string
  hesapAdi?: string | null
  cariHesapId?: number | null
  cariHesap?: { kod: string; ad: string } | null
  ozelKod?: string | null
  aciklama?: string | null
  vadeTarihi?: string | null
  miktar?: number | string | null
  belgeNo?: string | null
  doviz?: string | null
  dovizKuru?: number | string | null
  dovizTutari?: number | string | null
  borc: number | string
  alacak: number | string
}

export interface MuhasebeFis {
  id: number
  fisTipi: string
  fisNo: number
  fisTarihi: string
  belgeNo: string | null
  k: string | null
  ozelKod: string | null
  erisimKodu: string | null
  aciklama: string | null
  kaynakTuru: string | null
  kaynakId: number | null
  fasonTipiId?: number | null
  fasonTipi?: { id: number; ad: string } | null
  masrafYeri?: string | null
  satirlar: MuhasebeFisSatir[]
}

export type MuhasebeFisFormData = Omit<MuhasebeFis, 'id' | 'fisNo' | 'satirlar'> & {
  satirlar: MuhasebeFisSatir[]
}

export const muhasebeFisApi = {
  list: (fisTipi?: string) => api.get<MuhasebeFis[]>(`/muhasebe-fis${fisTipi ? `?fisTipi=${encodeURIComponent(fisTipi)}` : ''}`),
  getById: (id: number) => api.get<MuhasebeFis>(`/muhasebe-fis/${id}`),
  create: (data: MuhasebeFisFormData) => api.post<MuhasebeFis>('/muhasebe-fis', data),
  update: (id: number, data: Partial<MuhasebeFisFormData>) => api.put<MuhasebeFis>(`/muhasebe-fis/${id}`, data),
  remove: (id: number) => api.delete<void>(`/muhasebe-fis/${id}`),
}
