'use client'

import { api } from './api'

export interface Izin {
  id: number
  kod: string
  ad: string
}

export interface RolIzin {
  izinId: number
  izin: Izin
}

export interface Rol {
  id: number
  ad: string
  aciklama: string | null
  aktif: boolean
  createdAt: string
  updatedAt: string
  izinler: RolIzin[]
  _count: { kullanicilar: number }
}

export interface RolFormData {
  ad: string
  aciklama?: string
  aktif: boolean
  izinIdler: number[]
}

export const rolApi = {
  list: () => api.get<Rol[]>('/rol'),
  get: (id: number) => api.get<Rol>(`/rol/${id}`),
  izinler: () => api.get<Izin[]>('/rol/izinler'),
  create: (data: RolFormData) => api.post<Rol>('/rol', data),
  update: (id: number, data: RolFormData) => api.put<Rol>(`/rol/${id}`, data),
  delete: (id: number) => api.delete<void>(`/rol/${id}`),
}
