import { api } from './api'

export interface IsEmriKalem {
  id?: number
  sira?: number
  siparisNo?: string | null
  malzemeId?: number | null
  malzemeKod?: string | null
  malzemeAd?: string | null
  kg?: number | null
  mt?: number | null
  adet?: number | null
  kullanilanKg?: number | null
}

export interface IsEmri {
  id: number
  isEmriNo: string
  aciklama: string | null
  siparisNo: string | null
  musteriSiparisNo: string | null
  baslangicTarihi: string | null
  bitisTarihi: string | null
  durum: string | null
  kalemler: IsEmriKalem[]
}

export type CreateIsEmri = Omit<IsEmri, 'id'>
export type UpdateIsEmri = Partial<CreateIsEmri>

export const isEmriApi = {
  list: () => api.get<IsEmri[]>('/is-emri'),
  getById: (id: number) => api.get<IsEmri>(`/is-emri/${id}`),
  getByKod: (kod: string) => api.get<IsEmri>(`/is-emri/by-kod/${encodeURIComponent(kod)}`),
  create: (dto: CreateIsEmri) => api.post<IsEmri>('/is-emri', dto),
  update: (id: number, dto: UpdateIsEmri) => api.put<IsEmri>(`/is-emri/${id}`, dto),
  remove: (id: number) => api.delete<void>(`/is-emri/${id}`),
}
