export class HesaplaParamsDto {
  siparisId: number
  kalemId?: number | null
  tip?: string
}

export interface TedarikHesaplaSatir {
  malzemeId: number
  malzemeKod: string
  malzemeAd: string
  kumasGrupId: number
  kumasGrupKod: string
  renkId: number
  renkKod: string
  renkAd: string
  receteKalemId: number
  siparisKalemId: number
  birim: string
  brutMiktar: number
  netMiktar: number
  kumasNetToplam: number
}

export interface HesaplaSonuc {
  satirlar: TedarikHesaplaSatir[]
  toplamNet: number
  kaydedildi?: boolean
}
