import { api } from './api'

export interface Doviz {
  kod: string
  altKod: string | null
  ad: string
  sira: number
  resim: string | null
  kullanimda: boolean
}

export type CreateDoviz = Doviz
export type UpdateDoviz = Partial<CreateDoviz>

export interface DovizKuruSatir {
  dovizKodu: string
  dovizAd: string
  alisKuru: number | null
  satisKuru: number | null
  efektifAlis: number | null
  efektifSatis: number | null
  tarih: string | null
}

export const dovizApi = {
  list: () => api.get<Doviz[]>('/doviz'),
  getSonKurlar: () => api.get<DovizKuruSatir[]>('/doviz/kurlar/son'),
  getKurlar: (tarih: string) =>
    api.get<DovizKuruSatir[]>(`/doviz/kurlar?tarih=${encodeURIComponent(tarih)}`),
  getByKod: (kod: string) => api.get<Doviz>(`/doviz/${encodeURIComponent(kod)}`),
  create: (dto: CreateDoviz) => api.post<Doviz>('/doviz', dto),
  update: (kod: string, dto: UpdateDoviz) => api.put<Doviz>(`/doviz/${encodeURIComponent(kod)}`, dto),
  remove: (kod: string) => api.delete<void>(`/doviz/${encodeURIComponent(kod)}`),
}
