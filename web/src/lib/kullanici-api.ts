import { api } from './api'

export interface Kullanici {
  id: number
  kod: string
  ad: string
  durum: boolean
  girisKodu: string | null
  sifre: string | null
  kullaniciRolu: string | null
  cariHesapKodu: string | null
  yetkiliAdi: string | null
  kasaKodu: string | null
  departmanKodu: string | null
  personelKodu: string | null
  masrafYeri: string | null
  dilOndegeri: string | null
  ozelKod: string | null
  aciklama: string | null
  kullaniciTipi: string | null
  satisElemani: boolean
  mobilKullanici: boolean
  hizmetSunucusu: boolean
}

export type CreateKullanici = Omit<Kullanici, 'id'>
export type UpdateKullanici = Partial<CreateKullanici>

export const kullaniciApi = {
  list: () => api.get<Kullanici[]>('/kullanici'),
  getById: (id: number) => api.get<Kullanici>(`/kullanici/${id}`),
  getByKod: (kod: string) => api.get<Kullanici>(`/kullanici/by-kod/${encodeURIComponent(kod)}`),
  create: (dto: CreateKullanici) => api.post<Kullanici>('/kullanici', dto),
  update: (id: number, dto: UpdateKullanici) => api.put<Kullanici>(`/kullanici/${id}`, dto),
  remove: (id: number) => api.delete<void>(`/kullanici/${id}`),
}
