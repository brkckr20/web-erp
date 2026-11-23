// Menü ağacındaki ekranların izin tanımı. web/src/data/modules.ts ile birebir tutulmalıdır.
// Menüye ekran eklenince bu dosya da güncellenmeli ve seed-izinler çalıştırılmalıdır.

export const EKRAN_ISLEMLERI = ['goruntule', 'kaydet', 'sil', 'iptal'] as const
export type EkranIslemi = (typeof EKRAN_ISLEMLERI)[number]

export interface EkranTanimi {
  key: string
  ad: string
}

export interface ModulEkranTanimi {
  modul: string
  ad: string
  ekranlar: EkranTanimi[]
}

/** Ekran izin kodu: ekran.<modul>.<ekran>.<islem> */
export const ekranIzinKodu = (modul: string, ekran: string, islem: string) =>
  `ekran.${modul}.${ekran}.${islem}`

export const EKRAN_TANIMLARI: ModulEkranTanimi[] = [
  {
    modul: 'stok',
    ad: 'Malzeme Yönetimi',
    ekranlar: [
      { key: 'kumas-kartlari', ad: 'Kumaş Kartları' },
      { key: 'iplik-kartlari', ad: 'İplik Kartları' },
      { key: 'aksesuar-kartlari', ad: 'Aksesuar Kartları' },
      { key: 'aksesuar-tipi-kartlari', ad: 'Aksesuar Tipi Kartları' },
      { key: 'malzeme-kartlari', ad: 'Malzeme Kartları' },
      { key: 'proses-tanimlari', ad: 'Proses Tanımları' },
      { key: 'depo-tanimlari', ad: 'Depo Tanımları' },
      { key: 'raf-tanimlari', ad: 'Raf Tanımları' },
      { key: 'makina-kartlari', ad: 'Makina Kartları' },
      { key: 'hata-tanimlari', ad: 'Hata Tanımları' },
      { key: 'nakliyeci-tanimlari', ad: 'Nakliyeci Tanımları' },
      { key: 'numarator-tanimlari', ad: 'Numaratör Tanımları' },
      { key: 'kalite-kontrol-giris', ad: 'Kalite Kontrol Girişleri' },
      { key: 'stok-hareket-fisleri', ad: 'Malzeme Yönetim Fişleri' },
      { key: 'e-irsaliye-listesi', ad: 'e-İrsaliye Listesi' },
      { key: 'depo-bazli-stok', ad: 'Depo Bazlı Stok' },
      { key: 'depo-stok-detay', ad: 'Depo Stok Detayı' },
    ],
  },
  {
    modul: 'siparis',
    ad: 'Sipariş Yönetimi',
    ekranlar: [
      { key: 'model-kartlari', ad: 'Model Kartları' },
      { key: 'renk-kartlari', ad: 'Renk Kartları' },
      { key: 'boyahane-renk-kartlari', ad: 'Boyahane Renk Kartları' },
      { key: 'marka-kartlari', ad: 'Marka Kartları' },
      { key: 'grup-kartlari', ad: 'Grup Kartları' },
      { key: 'beden-tanimlari', ad: 'Beden Tanımları' },
      { key: 'gtip-tanimlari', ad: 'GTİP Tanımları' },
      { key: 'islem-kartlari', ad: 'İşlem Kartları' },
      { key: 'rota-tanimlari', ad: 'Rota Tanımları' },
      { key: 'kesim-emri', ad: 'Kesim Kartı' },
      { key: 'iade-talepleri', ad: 'İade Talepleri' },
      { key: 'siparis-girisi', ad: 'Sipariş Girişi' },
      { key: 'fason-hareket', ad: 'Fason Hareket Fişleri' },
      { key: 'uretim-hareket', ad: 'Üretim Hareket Fişleri' },
      { key: 'kumas-tedarik', ad: 'Kumaş Tedarik' },
      { key: 'iplik-tedarik', ad: 'İplik Tedarik' },
      { key: 'aksesuar-tedarik', ad: 'Aksesuar Tedarik' },
      { key: 'kumas-planlama', ad: 'Kumaş Planlama' },
      { key: 'iplik-planlama', ad: 'İplik Planlama' },
      { key: 'aksesuar-planlama', ad: 'Aksesuar Planlama' },
      { key: 'kumas-tedarik-raporu', ad: 'Kumaş Tedarik Raporu' },
    ],
  },
  {
    modul: 'uretim',
    ad: 'Üretim / Planlama',
    ekranlar: [
      { key: 'is-emri-tanimlari', ad: 'İş Emri Tanımları' },
      { key: 'uretim-plani', ad: 'Üretim Planı' },
      { key: 'is-emri', ad: 'İş Emirleri' },
      { key: 'kapasite-plan', ad: 'Kapasite Planlama' },
      { key: 'kk-formu', ad: 'Kalite Kontrol Formu' },
      { key: 'fire-takip', ad: 'Fire Takibi' },
    ],
  },
  {
    modul: 'satinalma',
    ad: 'Satın Alma',
    ekranlar: [
      { key: 'hizmet-kartlari', ad: 'Alınan Hizmet Kartları' },
      { key: 'satinalma-siparis', ad: 'Satın Alma Siparişi' },
      { key: 'satinalma-fiyat-teklifleri', ad: 'Satın Alma Fiyat Teklifleri' },
      { key: 'teslimat-takip', ad: 'Teslimat Takibi' },
      { key: 'tedarikci-degerlendirme', ad: 'Tedarikçi Değerlendirme' },
      { key: 'satinalma-kumas-irsaliyeleri', ad: 'Kumaş İrsaliyeleri' },
      { key: 'satinalma-iplik-irsaliyeleri', ad: 'İplik İrsaliyeleri' },
      { key: 'satinalma-aksesuar-irsaliyeleri', ad: 'Aksesuar İrsaliyeleri' },
      { key: 'satinalma-irsaliyeleri', ad: 'Satın Alma İrsaliyeleri' },
      { key: 'satinalma-kumas-faturalari', ad: 'Kumaş Faturaları' },
      { key: 'satinalma-iplik-faturalari', ad: 'İplik Faturaları' },
      { key: 'satinalma-aksesuar-faturalari', ad: 'Aksesuar Faturaları' },
      { key: 'satinalma-faturalari', ad: 'Satın Alma Faturaları' },
    ],
  },
  {
    modul: 'satis',
    ad: 'Satış / Dağıtım',
    ekranlar: [
      { key: 'cari-hesap-karti', ad: 'Cari Hesap Kartı' },
      { key: 'kumas-irsaliyeleri', ad: 'Kumaş İrsaliyeleri' },
      { key: 'iplik-irsaliyeleri', ad: 'İplik İrsaliyeleri' },
      { key: 'aksesuar-irsaliyeleri', ad: 'Aksesuar İrsaliyeleri' },
      { key: 'satis-irsaliyeleri', ad: 'Satış İrsaliyeleri' },
      { key: 'satis-kumas-faturalari', ad: 'Kumaş Faturaları' },
      { key: 'satis-iplik-faturalari', ad: 'İplik Faturaları' },
      { key: 'satis-aksesuar-faturalari', ad: 'Aksesuar Faturaları' },
      { key: 'satis-faturalari', ad: 'Satış Faturaları' },
      { key: 'musteri-siparis', ad: 'Müşteri Siparişi' },
      { key: 'sevkiyat', ad: 'Sevkiyat Planlama' },
      { key: 'irsaliye', ad: 'İrsaliye' },
    ],
  },
  {
    modul: 'muhasebe',
    ad: 'Muhasebe / Finans',
    ekranlar: [
      { key: 'kasa-hesaplari', ad: 'Kasa Hesapları' },
      { key: 'banka-hesaplari', ad: 'Banka Hesapları' },
      { key: 'doviz-tanimlari', ad: 'Döviz Tanımları' },
      { key: 'odeme-planlari', ad: 'Ödeme Planları' },
      { key: 'cari-hesap-fisleri', ad: 'Cari Hesap Fişleri' },
      { key: 'doviz-kurlari', ad: 'Döviz Kurları' },
      { key: 'odeme-takip', ad: 'Ödeme Takibi' },
      { key: 'banka-islem', ad: 'Banka İşlemleri' },
      { key: 'maliyet-analiz', ad: 'Maliyet Analizi' },
    ],
  },
  {
    modul: 'hizmet-talep',
    ad: 'Hizmet Talep',
    ekranlar: [
      { key: 'hizmet-talepleri', ad: 'Hizmet Talepleri' },
    ],
  },
  {
    modul: 'ayarlar',
    ad: 'Ayarlar',
    ekranlar: [
      { key: 'kullanici-tanimlari', ad: 'Kullanıcı Tanımları' },
      { key: 'rol-yonetimi', ad: 'Rol Yönetimi' },
      { key: 'sirket-tanimlari', ad: 'Şirket Tanımları' },
      { key: 'log-takibi', ad: 'Log Takibi' },
      { key: 'genel-ayarlar', ad: 'Genel Ayarlar' },
      { key: 'logo-yonetimi', ad: 'Logo Yönetimi' },
      { key: 'rapor-tasarimi', ad: 'Rapor Tasarımı' },
      { key: 'veritabani-yedek', ad: 'Veritabanı Yedek' },
      { key: 'renk-karti-transferi', ad: 'Renk Kartı Transferi' },
      { key: 'cari-hesap-transferi', ad: 'Cari Hesap Kartı Transferi' },
      { key: 'malzeme-yonetim-parametreleri', ad: 'Malzeme Yönetim Parametreleri' },
      { key: 'siparis-parametreleri', ad: 'Sipariş Parametreleri' },
      { key: 'program-parametreleri', ad: 'Program Parametreleri' },
    ],
  },
]
