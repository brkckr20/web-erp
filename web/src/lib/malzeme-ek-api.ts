'use client'

import { api } from './api'

export interface MalzemeEk {
  id: number
  malzemeId: number
  dosyaAdi: string
  mimetype: string
  boyut: number
  createdAt: string
}

export const malzemeEkApi = {
  list: (malzemeId: number) => api.get<MalzemeEk[]>(`/malzeme-ek/${malzemeId}`),
  upload: (malzemeId: number, files: File[]) => {
    const fd = new FormData()
    files.forEach((f) => fd.append('dosyalar', f))
    return api.upload<MalzemeEk[]>(`/malzeme-ek/${malzemeId}`, fd)
  },
  delete: (id: number) => api.delete<void>(`/malzeme-ek/${id}`),
  getDosyaUrl: (id: number) => `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/malzeme-ek/dosya/${id}`,
}