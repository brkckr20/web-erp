'use client'

import { api } from './api'

export interface SablonSorgu {
  id?: number
  ad: string
  sqlIcerik: string
  sira: number
}

export interface Sablon {
  id: number
  ad: string
  ekranAdi: string
  htmlIcerik: string
  sayfaEn: number
  sayfaBoy: number
  yon: string
  ustBosluk: number
  altBosluk: number
  solBosluk: number
  sagBosluk: number
  altBilgi: boolean
  aktif: boolean
  olusturmaTarihi: string
  guncellemeTarihi: string | null
  sorgular: SablonSorgu[]
}

export interface SablonOlustur {
  ad: string
  ekranAdi: string
  htmlIcerik: string
  sayfaEn?: number
  sayfaBoy?: number
  yon?: string
  ustBosluk?: number
  altBosluk?: number
  solBosluk?: number
  sagBosluk?: number
  altBilgi?: boolean
  sorgular?: { ad: string; sqlIcerik: string; sira?: number }[]
}

export interface OnizlemeSonuc {
  html: string
  sayfaEn: number
  sayfaBoy: number
  yon: string
  ustBosluk: number
  altBosluk: number
  solBosluk: number
  sagBosluk: number
}

export const sablonApi = {
  list: (ekranAdi?: string) => {
    const query = ekranAdi ? `?ekranAdi=${encodeURIComponent(ekranAdi)}` : ''
    return api.get<Sablon[]>(`/sablon${query}`)
  },
  get: (id: number) => api.get<Sablon>(`/sablon/${id}`),
  create: (data: SablonOlustur) => api.post<Sablon>('/sablon', data),
  update: (id: number, data: Partial<SablonOlustur>) => api.put<Sablon>(`/sablon/${id}`, data),
  remove: (id: number) => api.delete<void>(`/sablon/${id}`),
  onerizle: (id: number, parametreler?: Record<string, any>) =>
    api.post<OnizlemeSonuc>(`/sablon/${id}/onerizleme`, { parametreler }),
  pdfUrl: (id: number) => `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/sablon/${id}/pdf`,
  sorguCalistir: (sql: string, parametreler?: Record<string, any>) =>
    api.post<any[]>('/sablon/sorgu-calistir', { sql, parametreler }),
}
