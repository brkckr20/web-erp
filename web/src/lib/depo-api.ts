import { api } from './api'

export interface Depo {
  id: number
  kod: string
  ad: string
  durum: boolean
  barkodOnEki: string | null
  erisimKodu: string | null
  ozelKod: string | null
  isYeriKodu: string | null
  negatifStokKontrol: string | null
  kritikStokKontrol: string | null
  anaDepoOnDegeri: boolean
  sevkiyatDepoOnDegeri: boolean
  sanalDepo: boolean
  antrepoDepo: boolean
  showRoomDeposu: boolean
  kartelaDeposu: boolean
  adres1: string | null
  adres2: string | null
  postaKodu: string | null
  bolge: string | null
  ulke: string | null
  sehir: string | null
  ilce: string | null
  telefon: string | null
  faks: string | null
  eposta: string | null
  gpsX: string | null
  gpsY: string | null
  aciklama: string | null
}

export type CreateDepo = Omit<Depo, 'id'>
export type UpdateDepo = Partial<CreateDepo>

export const depoApi = {
  list: () => api.get<Depo[]>('/depo'),
  getById: (id: number) => api.get<Depo>(`/depo/${id}`),
  getByKod: (kod: string) => api.get<Depo>(`/depo/by-kod/${encodeURIComponent(kod)}`),
  create: (dto: CreateDepo) => api.post<Depo>('/depo', dto),
  update: (id: number, dto: UpdateDepo) => api.put<Depo>(`/depo/${id}`, dto),
  remove: (id: number) => api.delete<void>(`/depo/${id}`),
}
