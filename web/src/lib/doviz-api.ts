import { api } from './api'
import { parametreApi } from './parametre-api'

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

export type KurTipi = 'alis' | 'satis' | 'efektifAlis' | 'efektifSatis'

export const KUR_TIPI_ALAN: Record<KurTipi, keyof Pick<DovizKuruSatir, 'alisKuru' | 'satisKuru' | 'efektifAlis' | 'efektifSatis'>> = {
  alis: 'alisKuru',
  satis: 'satisKuru',
  efektifAlis: 'efektifAlis',
  efektifSatis: 'efektifSatis',
}

export const kurDegeri = (satir: DovizKuruSatir | null | undefined, tip: KurTipi): number | null => {
  if (!satir) return null
  const v = satir[KUR_TIPI_ALAN[tip]]
  return v == null ? null : Number(v)
}

export const getMerkezKurTipi = async (): Promise<KurTipi> => {
  try {
    const p = await parametreApi.get('doviz', 'kurTipi')
    const v = p?.deger
    return v === 'alis' || v === 'satis' || v === 'efektifAlis' || v === 'efektifSatis' ? v : 'satis'
  } catch {
    return 'satis'
  }
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
