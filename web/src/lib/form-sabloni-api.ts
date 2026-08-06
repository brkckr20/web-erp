import { api } from './api'

export interface FormSabloniOzet {
  id: number
  kod: string
  ad: string
  ekranTuru: string
  sorguSayisi: number
  bandSayisi: number
  aktif: boolean
  updatedAt: string
}

export interface FormSabloniDetay {
  id: number
  kod: string
  ad: string
  ekranTuru: string
  aktif: boolean
  sorgular: unknown[]
  layout: unknown[]
  sayfa: unknown
}

export interface CreateFormSabloni {
  kod: string
  ad: string
  ekranTuru: string
  sorgular: unknown[]
  layout: unknown[]
  sayfa: unknown
  aktif?: boolean
}

export type UpdateFormSabloni = Partial<CreateFormSabloni>

export interface SorguTestSonuc {
  kolonlar: string[]
  satirlar: Record<string, unknown>[]
}

export const formSabloniApi = {
  list: () => api.get<FormSabloniOzet[]>('/form-sabloni'),
  listByEkranTuru: (ekranTuru: string) =>
    api.get<FormSabloniOzet[]>(`/form-sabloni?ekranTuru=${encodeURIComponent(ekranTuru)}`),
  getById: (id: number) => api.get<FormSabloniDetay>(`/form-sabloni/${id}`),
  create: (dto: CreateFormSabloni) => api.post<{ id: number }>('/form-sabloni', dto),
  update: (id: number, dto: UpdateFormSabloni) => api.put<{ id: number }>(`/form-sabloni/${id}`, dto),
  remove: (id: number) => api.delete<{ id: number }>(`/form-sabloni/${id}`),
  sorguTest: (dto: { sorguMetni: string; parametreler?: Record<string, unknown> }) =>
    api.post<SorguTestSonuc>('/form-sabloni/sorgu-test', dto),
}
