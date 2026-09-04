'use client'

import { api } from './api'

export interface Logo {
  id: number
  ad: string
  dosyaYolu: string
  mimetype: string
  boyut: number
  createdAt: string
}

export const logoApi = {
  list: () => api.get<Logo[]>('/logo'),
  getByAd: (ad: string) => api.get<Logo>(`/logo?ad=${encodeURIComponent(ad)}`),
  getDosyaUrl: (ad: string) => `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'}/uploads/logos/${encodeURIComponent(ad)}`,
  upload: (ad: string, file: File) => {
    const formData = new FormData()
    formData.append('dosya', file)
    formData.append('ad', ad)
    return api.upload<Logo>('/logo', formData)
  },
  remove: (id: number) => api.delete<void>(`/logo/${id}`),
}
