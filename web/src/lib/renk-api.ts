import { api } from './api'

export interface Renk {
  id: number
  kod: string
  ad: string
  tip: number
  aciklama: string | null
  renk: string | null
  cariKodu: string | null
  cariAdi: string | null
  talepTarihi: string | null
  okeyTarihi: string | null
  fiyat: number | null
  dovizCinsi: string | null
  kullanimda: boolean
  tarih: string | null
  ozelKod: string | null
  pantoneNo: string | null
  renkTuru: string | null
  parentRenkId: number | null
  parentRenkAdi: string | null
}

export type CreateRenk = Omit<Renk, 'id' | 'cariAdi' | 'parentRenkAdi'>
export type UpdateRenk = Partial<CreateRenk>

export const renkApi = {
  list: (tip?: number) => api.get<Renk[]>(tip != null ? `/renk?tip=${tip}` : '/renk'),
  getById: (id: number) => api.get<Renk>(`/renk/${id}`),
  getByKod: (kod: string) => api.get<Renk>(`/renk/by-kod/${encodeURIComponent(kod)}`),
  create: (dto: CreateRenk) => api.post<Renk>('/renk', dto),
  update: (id: number, dto: UpdateRenk) => api.put<Renk>(`/renk/${id}`, dto),
  remove: (id: number) => api.delete<void>(`/renk/${id}`),
}