import { api } from './api'

export interface MasrafYeri {
  id: number
  kod: string
  ad: string
  ozelKod: string | null
  erisimKodu: string | null
  aciklama: string | null
  dovizCinsi: string | null
  kullanimda: boolean
}

export interface MasrafYeriFormData {
  kod: string
  ad: string
  ozelKod?: string | null
  erisimKodu?: string | null
  aciklama?: string | null
  dovizCinsi?: string | null
  kullanimda?: boolean
}

export const masrafYeriApi = {
  list: () => api.get<MasrafYeri[]>('/masraf-yeri'),
  getById: (id: number) => api.get<MasrafYeri>(`/masraf-yeri/${id}`),
  getByKod: (kod: string) =>
    api.get<MasrafYeri>(`/masraf-yeri/by-kod/${encodeURIComponent(kod)}`),
  create: (data: MasrafYeriFormData) => api.post<MasrafYeri>('/masraf-yeri', data),
  update: (id: number, data: Partial<MasrafYeriFormData>) =>
    api.put<MasrafYeri>(`/masraf-yeri/${id}`, data),
  remove: (id: number) => api.delete<void>(`/masraf-yeri/${id}`),
}