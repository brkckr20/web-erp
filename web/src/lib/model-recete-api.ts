'use client'

import { api } from './api'

export interface ReceteOlcu {
  id: number
  kalemId: number
  bedenId: number
  metraj: number | null
  en: number | null
  boy: number | null
  miktar: number | null
  beden?: { id: number; kod: string; sira: number }
}

export interface ReceteKalem {
  id: number
  receteId: number
  sira: number
  malzemeId: number | null
  birimFiyat: number | null
  dovizCinsi: string | null
  aciklama: string | null
  malzeme?: { id: number; kod: string; ad: string; tip: number }
  olculer: ReceteOlcu[]
}

export interface ModelRecete {
  id: number
  malzemeId: number
  aciklama: string | null
  kalemler: ReceteKalem[]
}

export interface CreateKalem {
  receteId: number
  malzemeId?: number
  birimFiyat?: number
  dovizCinsi?: string
  aciklama?: string
}

export interface CreateOlcu {
  kalemId: number
  bedenId: number
  metraj?: number
  en?: number
  boy?: number
  miktar?: number
}

export const modelReceteApi = {
  getByMalzeme: (malzemeId: number) => api.get<ModelRecete>(`/model-recete?malzemeId=${malzemeId}`),
  get: (id: number) => api.get<ModelRecete>(`/model-recete/${id}`),
  createKalem: (data: CreateKalem) => api.post<ReceteKalem>('/model-recete/kalem', data),
  updateKalem: (id: number, data: Partial<CreateKalem>) => api.put<ReceteKalem>(`/model-recete/kalem/${id}`, data),
  deleteKalem: (id: number) => api.delete<void>(`/model-recete/kalem/${id}`),
  upsertOlcu: (data: CreateOlcu) => api.post<ReceteOlcu>('/model-recete/olcu', data),
  deleteOlcu: (id: number) => api.delete<void>(`/model-recete/olcu/${id}`),
}
