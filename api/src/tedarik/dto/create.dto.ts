export class TedarikIhtiyacCreateDto {
  siparisId: number
  siparisKalemId: number
  receteKalemId?: number | null
  malzemeId: number
  malzemeKod: string
  malzemeAd: string
  kumasGrupId: number
  kumasGrupKod: string
  renkId: number
  renkKod: string
  renkAd: string
  brutMiktar: number
  netMiktar: number
  birim?: string
  tip?: string
  durum?: string
  aciklama?: string | null
  kayitYapan?: string | null
}
