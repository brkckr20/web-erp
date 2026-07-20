import { api } from './api'

export interface HataTanim {
  id: number
  hataKodu: string
  hataAdi: string
  ozelKod: string | null
  kullanimda: boolean
}

export type CreateHataTanim = Omit<HataTanim, 'id'>
export type UpdateHataTanim = Partial<CreateHataTanim>

export const hataTanimApi = {
  list: () => api.get<HataTanim[]>('/hata-tanim'),
  getById: (id: number) => api.get<HataTanim>(`/hata-tanim/${id}`),
  getByKod: (kod: string) => api.get<HataTanim>(`/hata-tanim/by-kod/${encodeURIComponent(kod)}`),
  create: (dto: CreateHataTanim) => api.post<HataTanim>('/hata-tanim', dto),
  update: (id: number, dto: UpdateHataTanim) => api.put<HataTanim>(`/hata-tanim/${id}`, dto),
  remove: (id: number) => api.delete<void>(`/hata-tanim/${id}`),
}
