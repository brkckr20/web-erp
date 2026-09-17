export class CreateHizmetTalepDto {
  baslik: string
  aciklama?: string
  durum?: string
  oncelik?: string
  tarih?: string
  kullanici?: string
  gorusmeKisi?: string
  kapanisTarihi?: string
}

export class UpdateHizmetTalepDto extends CreateHizmetTalepDto {}

export class CreateHizmetTalepNotDto {
  hizmetTalepId: number
  icerik: string
  gorusmeTarihi?: string
  iletisimKisi?: string
}

export class CreateHizmetTalepDosyaDto {
  hizmetTalepId: number
  hizmetTalepNotId?: number
  dosyaAdi: string
  dosyaYolu: string
}
