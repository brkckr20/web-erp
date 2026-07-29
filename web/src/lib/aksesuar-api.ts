'use client'

import { api } from './api'
import type { Malzeme } from './malzeme-api'

export interface Aksesuar extends Malzeme {
  aksesuarTipiAd?: string | null
}

export type AksesuarFormData = {
  kod: string
  ad: string
  kullanimda: boolean
  tip: number
  numaratorId: number | null
  aksesuarTipiId: number | null
  malzemeTuru: string | null
  cinsi: string | null
  renk: string | null
  ebat: string | null
  ureticiUrunKodu: string | null
  markaId: number | null
  ozellik1: string | null
  ozellik2: string | null
  ozellik3: string | null
  ozellik4: string | null
  derece: string | null
  enOlcu: string | null
  boyOlcu: string | null
  kapak: string | null
  micron: string | null
}

export const aksesuarApi = {
  list: () => api.get<Aksesuar[]>('/malzeme?tip=4'),
  get: (id: number) => api.get<Aksesuar>(`/malzeme/${id}`),
  getByKod: (kod: string) => api.get<Aksesuar>(`/malzeme/kod/${kod}`),
  nextKod: (numaratorId: number) => api.get<{ kod: string }>(`/malzeme/next-kod/${numaratorId}`),
  create: (data: AksesuarFormData) => api.post<Aksesuar>('/malzeme', data),
  update: (id: number, data: Partial<AksesuarFormData>) => api.put<Aksesuar>(`/malzeme/${id}`, data),
  delete: (id: number) => api.delete<void>(`/malzeme/${id}`),
}