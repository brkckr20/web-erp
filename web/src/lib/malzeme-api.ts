'use client'

import { api } from './api'

export interface Malzeme {
  id: number
  kod: string
  ad: string
  kullanimda: boolean
  tip: number
  malzemeTuru: string | null
  tipi: string | null
  kategori: string | null
  pluKodu: string | null
  rafOmru: number | null
  rafOmruBirim: string | null
  sezon: string | null
  marka: string | null
  model: string | null
  kdvGenel: string | null
  kdvPerakende: string | null
  kdvToptan: string | null
  kdvPSatisIade: string | null
  kdvTSatisIade: string | null
  ekVergiTanimi: string | null
  tevkifatSatinAlmaPay: number | null
  tevkifatSatinAlmaPayda: number | null
  tevkifatSatisPay: number | null
  tevkifatSatisPayda: number | null
  kullanimYeri: string | null
  takipSekli: string | null
  ureticiFirmaKodu: string | null
  ureticiUrunKodu: string | null
  isoDokumanNo: string | null
  gtipNo: string | null
  webSayfasi: string | null
  kampanyaGrubu: string | null
  fiyatGrubu: string | null
  operasyonKodu: string | null
  kumasTuruId: number | null
  kumasTuru?: { id: number; ad: string } | null
  numaratorId: number | null
  numarator?: { id: number; ad: string; onEk: string } | null
  cinsi: string | null
  grm2: number | null
  ebat: string | null
  en: number | null
  boy: number | null
  iplikBoyali: boolean | null
  ormeTipi: string | null
  kumasUretimTipi: string | null
}

export type MalzemeFormData = Omit<Malzeme, 'id' | 'kumasTuru'>

export const malzemeApi = {
  list: (tip?: number) => {
    const params = tip != null ? `?tip=${tip}` : ''
    return api.get<Malzeme[]>(`/malzeme${params}`)
  },
  get: (id: number) => api.get<Malzeme>(`/malzeme/${id}`),
  getByKod: (kod: string) => api.get<Malzeme>(`/malzeme/kod/${kod}`),
  nextKod: (numaratorId: number) => api.get<{ kod: string }>(`/malzeme/next-kod/${numaratorId}`),
  create: (data: MalzemeFormData) => api.post<Malzeme>('/malzeme', data),
  update: (id: number, data: Partial<MalzemeFormData>) => api.put<Malzeme>(`/malzeme/${id}`, data),
  delete: (id: number) => api.delete<void>(`/malzeme/${id}`),
}
