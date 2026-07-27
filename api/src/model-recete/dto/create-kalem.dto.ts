export class CreateKalemDto {
  receteId: number
  tip?: number
  malzemeId?: number
  birimFiyat?: number
  dovizCinsi?: string
  aciklama?: string
  islem?: string
  variant1?: string
  variant2?: string
  suslemeSecimi?: string
  kesilecek?: boolean
  anaKumas?: string
  tedarikHesaplanmayacak?: boolean
  kullanimYeri?: string
}
