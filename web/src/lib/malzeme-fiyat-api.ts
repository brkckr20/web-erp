import { api } from './api'

export interface MalzemeFiyat {
  id: number
  malzemeId: number
  kod: string | null
  aciklama: string | null
  tarih: string | null
  bedenId: number | null
  dovizCinsi: string | null
  fiyat: number | null
  dovizKuru: number | null
  baslangic: string | null
  bitis: string | null
  kullanimda: boolean | null
}

export interface CreateMalzemeFiyat {
  malzemeId: number
  kod?: string
  aciklama?: string
  tarih?: string
  bedenId?: number
  dovizCinsi?: string
  fiyat?: number
  dovizKuru?: number
  baslangic?: string
  bitis?: string
  kullanimda?: boolean
}

export type UpdateMalzemeFiyat = Partial<Omit<CreateMalzemeFiyat, 'malzemeId'>>

export const malzemeFiyatApi = {
  list: (malzemeId: number) => api.get<MalzemeFiyat[]>(`/malzeme-fiyat?malzemeId=${malzemeId}`),
  get: (id: number) => api.get<MalzemeFiyat>(`/malzeme-fiyat/${id}`),
  create: (dto: CreateMalzemeFiyat) => api.post<MalzemeFiyat>('/malzeme-fiyat', dto),
  update: (id: number, dto: UpdateMalzemeFiyat) => api.put<MalzemeFiyat>(`/malzeme-fiyat/${id}`, dto),
  remove: (id: number) => api.delete<void>(`/malzeme-fiyat/${id}`),
}
