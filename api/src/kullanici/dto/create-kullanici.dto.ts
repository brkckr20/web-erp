export class KullaniciSeriDto {
  id?: number
  belgeTuru: string
  seri: string
  aktif?: boolean
}

export class KullaniciTasarimDto {
  ad: string
  xsltDosyaAdi: string
  varsayilan?: boolean
  sira?: number
  aktif?: boolean
}

export class CreateKullaniciDto {
  kod: string
  ad: string
  durum?: boolean
  girisKodu?: string
  sifre?: string
  kullaniciRolu?: string
  cariHesapKodu?: string
  yetkiliAdi?: string
  kasaKodu?: string
  departmanKodu?: string
  personelKodu?: string
  masrafYeri?: string
  dilOndegeri?: string
  ozelKod?: string
  aciklama?: string
  kullaniciTipi?: string
  satisElemani?: boolean
  mobilKullanici?: boolean
  hizmetSunucusu?: boolean
  seriler?: KullaniciSeriDto[]
  tasarimlar?: KullaniciTasarimDto[]
}
