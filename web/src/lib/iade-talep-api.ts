'use client'

import { api } from './api'

export interface IadeTalep {
  id: number
  siparisNo: string
  modelKod: string
  modelAd: string | null
  renkAd: string
  beden: string
  kumasAd: string | null
  kumasRenk: string | null
  kalanMT: number
  durum: string
  olusturanKullanici: number | null
  olusturmaTarihi: string
  islenmeTarihi: string | null
  irsaliyeId: number | null
  aciklama: string | null
}

export type IadeTalepFormData = Omit<IadeTalep, 'id' | 'olusturmaTarihi' | 'islenmeTarihi' | 'irsaliyeId'>

export const iadeTalepApi = {
  list: (durum?: string) =>
    api.get<IadeTalep[]>(`/iade-talep${durum ? `?durum=${encodeURIComponent(durum)}` : ''}`),
  get: (id: number) => api.get<IadeTalep>(`/iade-talep/${id}`),
  create: (data: IadeTalepFormData) => api.post<IadeTalep>('/iade-talep', data),
  update: (id: number, data: Partial<IadeTalepFormData>) =>
    api.put<IadeTalep>(`/iade-talep/${id}`, data),
  remove: (id: number) => api.delete<void>(`/iade-talep/${id}`),
  iptal: (id: number) => api.put<IadeTalep>(`/iade-talep/${id}/iptal`, {}),
  irsaliyeOlustur: (id: number) => api.post<any>(`/iade-talep/${id}/irsaliye`, {}),
}
