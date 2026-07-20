'use client'

import { api } from './api'

export interface Makina {
  id: number
  kod: string
  ad: string
  kullanimda: boolean
  makinaTuru: string | null
  marka: string | null
  model: string | null
  seriNo: string | null
  envanterNo: string | null
  kategori: string | null
  lokasyon: string | null
  departman: string | null
  sorumlu: string | null
  ureticiFirma: string | null
  tedarikci: string | null
  alimTarihi: string | null
  garantiBitis: string | null
  alimBedeli: number | null
  gucKw: number | null
  kapasite: string | null
  kapasiteBirim: string | null
  voltaj: string | null
  bakimPeriyodu: number | null
  bakimPeriyoduBirim: string | null
  sonBakimTarihi: string | null
  durumu: string | null
  aciklama: string | null
}

export type MakinaFormData = Omit<Makina, 'id'>

export const makinaApi = {
  list: () => api.get<Makina[]>('/makina'),
  get: (id: number) => api.get<Makina>(`/makina/${id}`),
  getByKod: (kod: string) => api.get<Makina>(`/makina/kod/${kod}`),
  create: (data: MakinaFormData) => api.post<Makina>('/makina', data),
  update: (id: number, data: Partial<MakinaFormData>) => api.put<Makina>(`/makina/${id}`, data),
  delete: (id: number) => api.delete<void>(`/makina/${id}`),
}
