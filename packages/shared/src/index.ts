export type DepoStatus = 'AKTIF' | 'PASIF'

export interface Depo {
  id: number
  kod: string
  isim: string
  status: DepoStatus
  createdAt: Date
  updatedAt: Date
}
