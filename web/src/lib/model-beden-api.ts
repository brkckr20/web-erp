'use client'

import { api } from './api'

export interface ModelBeden {
  id: number
  malzemeId: number
  bedenId: number
  beden: { id: number; kod: string; sira: number }
}

export const modelBedenApi = {
  getByMalzeme: (malzemeId: number) => api.get<ModelBeden[]>(`/model-beden?malzemeId=${malzemeId}`),
  add: (data: { malzemeId: number; bedenId: number }) => api.post<ModelBeden>('/model-beden', data),
  remove: (malzemeId: number, bedenId: number) => api.delete<void>(`/model-beden?malzemeId=${malzemeId}&bedenId=${bedenId}`),
}
