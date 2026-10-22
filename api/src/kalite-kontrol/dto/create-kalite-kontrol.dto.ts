export class CreateKaliteKontrolKalemDto {
  barkod?: string
  /** Bu top hangi irsaliye kaleminden (11-Fasondan Giriş) geldi? 1 irsaliye kalemi → N KK kalemi. */
  irsaliyeKalemId?: number | null
  /** Partiye bağlı kaçıncı top? Boşsa sunucu atar (fiş + parti + boyahane rengi + malzeme grubu). */
  topNo?: number | null
  malzemeId?: number
  netAgirlik?: number
  netMetre?: number
  adet?: number
  aciklama?: string
  isEmriNo?: string
  isEmriKg?: number
}

export class UpdateKaliteKontrolKalemDto extends CreateKaliteKontrolKalemDto {}

export class CreateKaliteKontrolDto {
  fisNo: string
  isEmriNo?: string
  fisTarihi?: string
  aciklama?: string
  belgeAdi?: string
  kayitYapan?: string
  kayitTarihi?: string
  guncelleyen?: string
  guncellemeTarihi?: string
  cariHesapId?: number
  depoId?: number
  isEmriId?: number
  kalemler?: CreateKaliteKontrolKalemDto[]
}

export class UpdateKaliteKontrolDto extends CreateKaliteKontrolDto {}
