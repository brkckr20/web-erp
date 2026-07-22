export interface SubItem {
  key: string
  label: string
  isFavorite?: boolean
  isForm?: boolean
}

export interface Category {
  title: string
  items: SubItem[]
}

export interface Module {
  key: string
  label: string
  icon: string
  categories: Category[]
}

export interface Tab {
  key: string
  label: string
  moduleKey: string
  isForm?: boolean
}

export const modules: Module[] = [
  {
    key: 'stok',
    label: 'Stok / Envanter',
    icon: '📦',
    categories: [
      {
        title: 'Tanımlamalar',
        items: [
          { key: 'depo-tanimlari', label: 'Depo Tanımları', isForm: true },
          { key: 'malzeme-kartlari', label: 'Malzeme Kartları', isForm: true },
          { key: 'makina-kartlari', label: 'Makina Kartları', isForm: true },
          { key: 'hata-tanimlari', label: 'Hata Tanımları', isForm: true },
          { key: 'kumas-kartlari', label: 'Kumaş Kartları', isFavorite: true, isForm: true },
          { key: 'numarator-tanimlari', label: 'Numaratör Tanımları', isForm: true },
        ],
      },
      {
        title: 'Stok İşlemleri',
        items: [
          { key: 'kalite-kontrol-giris', label: 'Kalite Kontrol Girişleri', isForm: true },
          { key: 'stok-hareket-fisleri', label: 'Stok Hareket Fişleri', isForm: true },
        ],
      },
      {
        title: 'Raporlar',
        items: [
          { key: 'stok-ozeti', label: 'Stok Özeti' },
          { key: 'hareket-gecmisi', label: 'Hareket Geçmişi' },
          { key: 'depo-bazli-stok', label: 'Depo Bazlı Stok' },
          { key: 'kumas-lot-takip', label: 'Kumaş Lot Takibi', isFavorite: true },
          { key: 'fire-raporu', label: 'Fire Raporu' },
          { key: 'stok-deger', label: 'Stok Değer Raporu' },
          { key: 'kritik-stok', label: 'Kritik Stok Raporu' },
          { key: 'sayim-farki', label: 'Sayım Fark Raporu' },
          { key: 'tedarikci-analiz', label: 'Tedarikçi Analizi' },
          { key: 'hareket-ozet', label: 'Hareket Özet Raporu' },
        ],
      },
    ],
  },
  {
    key: 'siparis',
    label: 'Sipariş Yönetimi',
    icon: '📋',
    categories: [
      {
        title: 'Tanımlamalar',
        items: [
          { key: 'olcu-tanim', label: 'Ölçü Tanım Kartları', isForm: true },
          { key: 'model-kartlari', label: 'Model Kartları', isFavorite: true, isForm: true },
          { key: 'mamul-kartlari', label: 'Mamül Kartları', isForm: true },
        ],
      },
      {
        title: 'Kesim İşlemleri',
        items: [
          { key: 'iplik-planlama', label: 'İplik Planlama', isFavorite: true },
          { key: 'kumas-planlama', label: 'Kumaş Planlama', isFavorite: true },
          { key: 'kesim-emri', label: 'Kesim Emri', isForm: true },
        ],
      },
      {
        title: 'Hareketler',
        items: [
          { key: 'fason-hareket', label: 'Fason Hareket Fişleri', isFavorite: true, isForm: true },
          { key: 'uretim-hareket', label: 'Üretim Hareket Fişleri', isForm: true },
        ],
      },
      {
        title: 'Raporlar',
        items: [
          { key: 'siparis-durum', label: 'Sipariş Durum Raporu' },
          { key: 'uretim-takip', label: 'Üretim Takip Raporu' },
        ],
      },
    ],
  },
  {
    key: 'uretim',
    label: 'Üretim / Planlama',
    icon: '⚙️',
    categories: [
      {
        title: 'Planlama',
        items: [
          { key: 'is-emri-tanimlari', label: 'İş Emri Tanımları', isForm: true },
          { key: 'uretim-plani', label: 'Üretim Planı', isForm: true },
          { key: 'is-emri', label: 'İş Emirleri', isFavorite: true, isForm: true },
          { key: 'kapasite-plan', label: 'Kapasite Planlama' },
        ],
      },
      {
        title: 'Kalite Kontrol',
        items: [
          { key: 'kk-formu', label: 'Kalite Kontrol Formu', isForm: true },
          { key: 'fire-takip', label: 'Fire Takibi' },
        ],
      },
    ],
  },
  {
    key: 'satinalma',
    label: 'Satın Alma',
    icon: '🛒',
    categories: [
      {
        title: 'İşlemler',
        items: [
          { key: 'siparis-girisi', label: 'Satın Alma Siparişi', isFavorite: true, isForm: true },
          { key: 'teslimat-takip', label: 'Teslimat Takibi' },
          { key: 'tedarikci-degerlendirme', label: 'Tedarikçi Değerlendirme' },
        ],
      },
    ],
  },
  {
    key: 'satis',
    label: 'Satış / Dağıtım',
    icon: '🚚',
    categories: [
      {
        title: 'Tanımlamalar',
        items: [
          { key: 'cari-hesap-karti', label: 'Cari Hesap Kartı', isForm: true },
        ],
      },
      {
        title: 'İşlemler',
        items: [
          { key: 'musteri-siparis', label: 'Müşteri Siparişi', isForm: true },
          { key: 'sevkiyat', label: 'Sevkiyat Planlama', isForm: true },
          { key: 'irsaliye', label: 'İrsaliye', isForm: true },
          { key: 'fatura', label: 'Fatura', isForm: true },
        ],
      },
    ],
  },
  {
    key: 'muhasebe',
    label: 'Muhasebe / Finans',
    icon: '💰',
    categories: [
      {
        title: 'İşlemler',
        items: [
          { key: 'odeme-takip', label: 'Ödeme Takibi' },
          { key: 'banka-islem', label: 'Banka İşlemleri' },
          { key: 'maliyet-analiz', label: 'Maliyet Analizi', isFavorite: true },
        ],
      },
    ],
  },
  {
    key: 'ayarlar',
    label: 'Ayarlar',
    icon: '⚙️',
    categories: [
      {
        title: 'Sistem',
        items: [
          { key: 'kullanici-tanimlari', label: 'Kullanıcı Tanımları', isForm: true },
          { key: 'genel-ayarlar', label: 'Genel Ayarlar', isForm: true },
          { key: 'veritabani-yedek', label: 'Veritabanı Yedek' },
        ],
      },
    ],
  },
]
