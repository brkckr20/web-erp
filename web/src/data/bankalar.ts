// EFT banka kodları (5 haneli). Yeni banka eklendikçe bu liste genişletilir.
export interface BankaTanim {
  kod: string
  ad: string
}

export const BANKALAR: BankaTanim[] = [
  { kod: '00001', ad: 'Türkiye Cumhuriyet Merkez Bankası' },
  { kod: '00004', ad: 'İller Bankası' },
  { kod: '00010', ad: 'T.C. Ziraat Bankası' },
  { kod: '00012', ad: 'Türkiye Halk Bankası' },
  { kod: '00014', ad: 'Türkiye Sınai Kalkınma Bankası' },
  { kod: '00015', ad: 'Türkiye Vakıflar Bankası' },
  { kod: '00016', ad: 'Türkiye İhracat Kredi Bankası (Eximbank)' },
  { kod: '00017', ad: 'Türkiye Kalkınma Bankası' },
  { kod: '00032', ad: 'Türk Ekonomi Bankası (TEB)' },
  { kod: '00034', ad: 'Aktif Yatırım Bankası' },
  { kod: '00046', ad: 'Akbank' },
  { kod: '00058', ad: 'Sınai Yatırım Bankası' },
  { kod: '00059', ad: 'Şekerbank' },
  { kod: '00062', ad: 'Türkiye Garanti Bankası' },
  { kod: '00064', ad: 'Türkiye İş Bankası' },
  { kod: '00067', ad: 'Yapı ve Kredi Bankası' },
  { kod: '00091', ad: 'Arap Türk Bankası' },
  { kod: '00092', ad: 'Citibank' },
  { kod: '00096', ad: 'Turkish Bank' },
  { kod: '00103', ad: 'Fibabanka' },
  { kod: '00108', ad: 'Turkland Bank' },
  { kod: '00111', ad: 'QNB Finansbank' },
  { kod: '00123', ad: 'HSBC Bank' },
  { kod: '00124', ad: 'Alternatifbank' },
  { kod: '00125', ad: 'Burganbank' },
  { kod: '00133', ad: 'ING Bank' },
  { kod: '00134', ad: 'Denizbank' },
  { kod: '00135', ad: 'Anadolubank' },
  { kod: '00146', ad: 'Odeabank' },
  { kod: '00148', ad: 'Intesa Sanpaolo' },
  { kod: '00203', ad: 'Albaraka Türk Katılım Bankası' },
  { kod: '00205', ad: 'Kuveyt Türk Katılım Bankası' },
  { kod: '00206', ad: 'Türkiye Finans Katılım Bankası' },
  { kod: '00210', ad: 'Vakıf Katılım Bankası' },
]
