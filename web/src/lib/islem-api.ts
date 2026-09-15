'use client'

import { api } from './api'

export interface Islem {
  id: number
  kod: string
  ad: string
  birim: string | null
  sira: number
  aktif: boolean
}
export interface CreateIslem {
  kod: string
  ad: string
  birim?: string | null
  sira?: number
  aktif?: boolean
}

// Eski adla uyumluluk (IslemKartlari ekranından re-export edilir)
export type IslemKarti = Islem

export const islemApi = {
  list: () => api.get<Islem[]>('/islem'),
  get: (id: number) => api.get<Islem>(`/islem/${id}`),
  create: (data: CreateIslem) => api.post<Islem>('/islem', data),
  update: (id: number, data: Partial<CreateIslem>) => api.put<Islem>(`/islem/${id}`, data),
  remove: (id: number) => api.delete<void>(`/islem/${id}`),
}
