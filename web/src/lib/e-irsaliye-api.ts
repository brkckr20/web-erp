'use client'

import { api } from './api'

export interface EIrsaliyeLog {
  id: number
  islem: string
  durum: string | null
  ettnNo: string | null
  eIrsaliyeNo: string | null
  mesaj: string | null
  kullaniciAd: string | null
  createdAt: string
}

export interface EIrsaliyeTasarim {
  ad: string
  xsltDosyaAdi: string
  varsayilan: boolean
}

export interface EIrsaliyePayload {
  fis: {
    id: number
    fisNo: string | null
    fisTipi: string
    tarih: string | null
    cariKod: string | null
    cariAd: string | null
    depo: string | null
    nakliyeci: string | null
  }
  eIrsaliye: {
    durum: string | null
    ettnNo: string | null
    eIrsaliyeNo: string | null
    xsltDosyaAdi: string | null
    xml: string | null
  }
  loglar: EIrsaliyeLog[]
  tasarimlar: EIrsaliyeTasarim[]
  varsayilanXslt: string | null
}

export interface EIrsaliyeListeSatiri {
  id: number
  irsaliyeNo: string | null
  irsaliyeTipi: string
  irsaliyeTarihi: string | null
  kayitYapan: string | null
  eIrsaliyeNo: string | null
  eIrsaliyeDurum: string | null
  ettnNo: string | null
  xsltDosyaAdi: string | null
  cariHesap: { kod: string; ad: string } | null
  depo: { kod: string } | null
}

export const eIrsaliyeApi = {
  liste: () => api.get<EIrsaliyeListeSatiri[]>('/irsaliye/e-irsaliye-listesi'),
  get: (fisId: number) => api.get<EIrsaliyePayload>(`/irsaliye/${fisId}/e-irsaliye`),
  olustur: (fisId: number, body?: { xsltDosyaAdi?: string; seriId?: number; yenile?: boolean }) =>
    api.post<EIrsaliyePayload>(`/irsaliye/${fisId}/e-irsaliye/olustur`, body ?? {}),
  gonder: (fisId: number) => api.post<EIrsaliyePayload>(`/irsaliye/${fisId}/e-irsaliye/gonder`),
  iptal: (fisId: number) => api.post<EIrsaliyePayload>(`/irsaliye/${fisId}/e-irsaliye/iptal`),
  belgeNoSifirla: (fisId: number) =>
    api.post<EIrsaliyePayload>(`/irsaliye/${fisId}/e-irsaliye/belge-no-sifirla`),
  tasarimSec: (fisId: number, xsltDosyaAdi: string) =>
    api.put<EIrsaliyePayload>(`/irsaliye/${fisId}/e-irsaliye/tasarim`, { xsltDosyaAdi }),
}
