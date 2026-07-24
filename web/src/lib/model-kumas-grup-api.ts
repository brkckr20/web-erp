'use client'

import { api } from './api'

export interface ModelKumasGrup {
  id: number
  malzemeId: number
  kumasGrupId: number
  kumasGrup: { id: number; kod: string }
}

export const modelKumasGrupApi = {
  getByMalzeme: (malzemeId: number) => api.get<ModelKumasGrup[]>(`/model-kumas-grup?malzemeId=${malzemeId}`),
  add: (data: { malzemeId: number; kumasGrupId: number }) => api.post<ModelKumasGrup>('/model-kumas-grup', data),
  remove: (malzemeId: number, kumasGrupId: number) => api.delete<void>(`/model-kumas-grup?malzemeId=${malzemeId}&kumasGrupId=${kumasGrupId}`),
}
