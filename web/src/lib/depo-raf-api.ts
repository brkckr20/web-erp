import { api } from './api'

export interface DepoRaf {
  id: number
  depoId: number
  kod: string
  ad: string
  kat: number | null
  rafTipi: string | null
  kapasite: number | null
  kapasiteBirimi: string | null
  aktif: boolean
  sira: number
  aciklama: string | null
  createdAt: string
  updatedAt: string
  depo: { id: number; kod: string; ad: string }
}

export type CreateDepoRaf = Omit<DepoRaf, 'id' | 'createdAt' | 'updatedAt' | 'depo'>
export type UpdateDepoRaf = Partial<CreateDepoRaf>

export const depoRafApi = {
  list: (filtre?: { depoId?: number; aktif?: string }) => {
    const p = new URLSearchParams()
    if (filtre?.depoId) p.set('depoId', String(filtre.depoId))
    if (filtre?.aktif) p.set('aktif', filtre.aktif)
    const s = p.toString()
    return api.get<DepoRaf[]>(`/depo-raf${s ? `?${s}` : ''}`)
  },
  getById: (id: number) => api.get<DepoRaf>(`/depo-raf/${id}`),
  create: (dto: CreateDepoRaf) => api.post<DepoRaf>('/depo-raf', dto),
  update: (id: number, dto: UpdateDepoRaf) => api.put<DepoRaf>(`/depo-raf/${id}`, dto),
  remove: (id: number) => api.delete<void>(`/depo-raf/${id}`),
}
