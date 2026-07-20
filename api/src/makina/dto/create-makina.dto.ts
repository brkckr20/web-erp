export class CreateMakinaDto {
  kod: string
  ad: string
  kullanimda?: boolean
  makinaTuru?: string
  marka?: string
  model?: string
  seriNo?: string
  envanterNo?: string
  kategori?: string
  lokasyon?: string
  departman?: string
  sorumlu?: string
  ureticiFirma?: string
  tedarikci?: string
  alimTarihi?: string
  garantiBitis?: string
  alimBedeli?: number
  gucKw?: number
  kapasite?: string
  kapasiteBirim?: string
  voltaj?: string
  bakimPeriyodu?: number
  bakimPeriyoduBirim?: string
  sonBakimTarihi?: string
  durumu?: string
  aciklama?: string
}
