'use client'

import { api } from './api'

export interface YevmiyeSatir {
  id: number
  hesapKodu: string
  hesapAdi: string | null
  aciklama: string | null
  detay: string
  borc: number
  alacak: number
}

export interface YevmiyeMadde {
  maddeNo: number
  fisId: number
  fisTipi: string
  fisNo: number
  fisTarihi: string
  belgeNo: string | null
  aciklama: string | null
  satirlar: YevmiyeSatir[]
}

export const yevmiyeDefteriApi = {
  list: (params?: { baslangic?: string; bitis?: string; fisTipi?: string }) => {
    const qs = new URLSearchParams()
    if (params?.baslangic) qs.set('baslangic', params.baslangic)
    if (params?.bitis) qs.set('bitis', params.bitis)
    if (params?.fisTipi) qs.set('fisTipi', params.fisTipi)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return api.get<YevmiyeMadde[]>(`/rapor/yevmiye-defteri${suffix}`)
  },
}
