import { api } from '@/lib/api'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface FiyatTeklifKalem {
  id?: number
  fiyatTeklifId?: number
  malzemeKod: string
  malzemeAd: string | null
  miktar: string | number
  birim: string
  birimFiyat: string | number
  dovizCinsi: string
  dovizKuru: string | number | null
  aciklama: string | null
  sira?: number
}

export interface FiyatTeklifDosya {
  id: number
  fiyatTeklifId: number
  dosyaAdi: string
  mimetype: string | null
  boyut: number | null
  createdAt: string
}

export interface FiyatTeklif {
  id: number
  teklifNo: string
  tarih: string
  gecerlilikTarihi: string | null
  cariKod: string
  cariAd: string | null
  aciklama: string | null
  kalemler: FiyatTeklifKalem[]
  dosyalar: FiyatTeklifDosya[]
  createdAt: string
  updatedAt: string
}

export interface FiyatTeklifKalemPayload {
  malzemeKod: string
  malzemeAd?: string
  miktar: number
  birim?: string
  birimFiyat?: number
  dovizCinsi?: string
  dovizKuru?: number | null
  aciklama?: string
}

export interface FiyatTeklifPayload {
  tarih?: string
  gecerlilikTarihi?: string | null
  cariKod: string
  cariAd?: string
  aciklama?: string
  olusturanKullanici?: number | null
  kalemler: FiyatTeklifKalemPayload[]
}

export const fiyatTeklifApi = {
  list: (cariKod?: string) =>
    api.get<FiyatTeklif[]>(cariKod ? `/fiyat-teklif?cariKod=${encodeURIComponent(cariKod)}` : '/fiyat-teklif'),
  get: (id: number) => api.get<FiyatTeklif>(`/fiyat-teklif/${id}`),
  nextNo: () => api.get<{ teklifNo: string }>('/fiyat-teklif/next-no'),
  create: (data: FiyatTeklifPayload) => api.post<FiyatTeklif>('/fiyat-teklif', data),
  update: (id: number, data: FiyatTeklifPayload) => api.put<FiyatTeklif>(`/fiyat-teklif/${id}`, data),
  remove: (id: number) => api.delete(`/fiyat-teklif/${id}`),
  addDosya: (fiyatTeklifId: number, file: File) => {
    const fd = new FormData()
    fd.append('dosya', file)
    fd.append('fiyatTeklifId', String(fiyatTeklifId))
    return api.upload<FiyatTeklifDosya>('/fiyat-teklif/dosya', fd)
  },
  removeDosya: (id: number) => api.delete(`/fiyat-teklif/dosya/${id}`),
  getDosyaUrl: (id: number) => `${BASE_URL}/fiyat-teklif/dosya/${id}`,
}
