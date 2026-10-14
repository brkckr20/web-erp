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
  kapanisTarihi: string
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
  mimetype: string | null
  boyut: number | null
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
  addDosya: (hizmetTalepId: number, file: File, hizmetTalepNotId?: number) => {
    const fd = new FormData()
    fd.append('dosya', file)
    fd.append('hizmetTalepId', String(hizmetTalepId))
    if (hizmetTalepNotId != null) fd.append('hizmetTalepNotId', String(hizmetTalepNotId))
    return api.upload<HizmetTalepDosya>('/hizmet-talep/dosya', fd)
  },
  removeDosya: (id: number) => api.delete(`/hizmet-talep/dosya/${id}`),
  getDosyaUrl: (id: number) => `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/hizmet-talep/dosya/${id}`,
}
