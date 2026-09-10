import { api } from '@/lib/api'

export interface HizmetTalep {
  id: number
  baslik: string
  aciklama: string | null
  durum: string
  oncelik: string
  tarih: string
  kullanici: string | null
  gorusmeKisi: string | null
  olusturmaTarihi: string
  guncellemeTarihi: string | null
  notlar?: HizmetTalepNot[]
  dosyalar?: HizmetTalepDosya[]
}

export interface HizmetTalepNot {
  id: number
  hizmetTalepId: number
  icerik: string
  gorusmeTarihi: string | null
  iletisimKisi: string | null
  olusturmaTarihi: string
}

export interface HizmetTalepDosya {
  id: number
  hizmetTalepId: number
  hizmetTalepNotId: number | null
  dosyaAdi: string
  dosyaYolu: string
  olusturmaTarihi: string
}

export const hizmetTalepApi = {
  list: () => api.get<HizmetTalep[]>('/hizmet-talep'),
  get: (id: number) => api.get<HizmetTalep>(`/hizmet-talep/${id}`),
  create: (data: Partial<HizmetTalep>) => api.post<HizmetTalep>('/hizmet-talep', data),
  update: (id: number, data: Partial<HizmetTalep>) => api.put<HizmetTalep>(`/hizmet-talep/${id}`, data),
  remove: (id: number) => api.delete(`/hizmet-talep/${id}`),
  addNot: (data: { hizmetTalepId: number; icerik: string; gorusmeTarihi?: string; iletisimKisi?: string }) =>
    api.post<HizmetTalepNot>('/hizmet-talep/not', data),
  removeNot: (id: number) => api.delete(`/hizmet-talep/not/${id}`),
  addDosya: (data: { hizmetTalepId: number; hizmetTalepNotId?: number; dosyaAdi: string; dosyaYolu: string }) =>
    api.post<HizmetTalepDosya>('/hizmet-talep/dosya', data),
  removeDosya: (id: number) => api.delete(`/hizmet-talep/dosya/${id}`),
}
