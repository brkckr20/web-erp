import { api } from './api'

export interface OdemePlanSatir {
  id?: number
  sira?: number
  gun: number
  oran: number | string
}

export interface OdemePlan {
  id: number
  kod: string
  ad: string
  aciklama: string | null
  yetkiKodu: string | null
  ozelKod: string | null
  uluslararasiKod: string | null
  kullanimda: boolean
  satirlar: OdemePlanSatir[]
}

export interface OdemePlanFormData {
  kod: string
  ad: string
  aciklama?: string
  yetkiKodu?: string | null
  ozelKod?: string | null
  uluslararasiKod?: string | null
  kullanimda?: boolean
  satirlar?: { id?: number; sira?: number; gun: number; oran: number }[]
}

export const odemePlanApi = {
  list: () => api.get<OdemePlan[]>('/odeme-plan'),
  getById: (id: number) => api.get<OdemePlan>(`/odeme-plan/${id}`),
  getByKod: (kod: string) =>
    api.get<OdemePlan>(`/odeme-plan/by-kod/${encodeURIComponent(kod)}`),
  create: (data: OdemePlanFormData) => api.post<OdemePlan>('/odeme-plan', data),
  update: (id: number, data: Partial<OdemePlanFormData>) =>
    api.put<OdemePlan>(`/odeme-plan/${id}`, data),
  remove: (id: number) => api.delete<void>(`/odeme-plan/${id}`),
}
