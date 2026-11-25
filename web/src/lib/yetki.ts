import { modules, type Module } from '@/data/modules'

export const EKRAN_ISLEMLERI = ['goruntule', 'kaydet', 'sil', 'iptal'] as const
export type EkranIslemi = (typeof EKRAN_ISLEMLERI)[number]

export const YETKI_YOK = 'Bu işlem için yetkiniz yok'

/** Ekran izin kodu: ekran.<modul>.<ekran>.<islem> (API tarafı ekran-tanimi.ts ile aynı) */
export const ekranIzinKodu = (modul: string, ekran: string, islem: EkranIslemi | string) =>
  `ekran.${modul}.${ekran}.${islem}`

/**
 * izinler tanımsızsa (izinler eklenmeden önce açılmış oturum) kısıt uygulanmaz.
 * Modül/ekran bilinmiyorsa da görünürlük serbest bırakılır; asıl koruma API'de.
 */
export function ekranYetkisi(
  izinler: string[] | undefined | null,
  modul: string | null | undefined,
  ekran: string | null | undefined,
  islem: EkranIslemi | string,
): boolean {
  if (!izinler) return true
  if (!modul || !ekran) return true
  return izinler.includes(ekranIzinKodu(modul, ekran, islem))
}

/** Menüyü kullanıcının görebildiği ekranlara indirger; boş kalan kategori/modül gizlenir. */
export function izinliModuller(izinler?: string[] | null): Module[] {
  if (!izinler) return modules
  return modules
    .map((mod) => ({
      ...mod,
      categories: mod.categories
        .map((cat) => ({
          ...cat,
          items: cat.items.filter((item) => ekranYetkisi(izinler, mod.key, item.key, 'goruntule')),
        }))
        .filter((cat) => cat.items.length > 0),
    }))
    .filter((mod) => mod.categories.length > 0)
}

// Listeden açılan kart sekmeleri menü anahtarı taşımaz; ön ek ile ekrana bağlanır.
const KART_ONEKLERI: { onek: string; ekran: string }[] = [
  { onek: 'aksesuar-tipi-karti', ekran: 'aksesuar-tipi-kartlari' },
  { onek: 'boyahane-renk-karti', ekran: 'boyahane-renk-kartlari' },
  { onek: 'malzeme-yonetim-fisi', ekran: 'stok-hareket-fisleri' },
  { onek: 'kalite-kontrol-karti', ekran: 'kalite-kontrol-giris' },
  { onek: 'numarator-karti', ekran: 'numarator-tanimlari' },
  { onek: 'cari-hesap-karti', ekran: 'cari-hesap-karti' },
  { onek: 'kullanici-karti', ekran: 'kullanici-tanimlari' },
  { onek: 'nakliyeci-karti', ekran: 'nakliyeci-tanimlari' },
  { onek: 'hata-tanim-karti', ekran: 'hata-tanimlari' },
  { onek: 'satis-irsaliye', ekran: 'satis-irsaliyeleri' },
  { onek: 'uretime-cikis', ekran: 'stok-hareket-fisleri' },
  { onek: 'tedarik-kumas', ekran: 'kumas-tedarik' },
  { onek: 'tedarik-iplik', ekran: 'iplik-tedarik' },
  { onek: 'tedarik-aksesuar', ekran: 'aksesuar-tedarik' },
  { onek: 'siparis-karti', ekran: 'siparis-girisi' },
  { onek: 'is-emri-karti', ekran: 'is-emri' },
  { onek: 'malzeme-karti', ekran: 'malzeme-kartlari' },
  { onek: 'sirket-karti', ekran: 'sirket-tanimlari' },
  { onek: 'kasa-hesabi-karti', ekran: 'kasa-hesaplari' },
  { onek: 'banka-hesabi-karti', ekran: 'banka-hesaplari' },
  { onek: 'odeme-plani-karti', ekran: 'odeme-planlari' },
  { onek: 'masraf-yeri-karti', ekran: 'masraf-yerleri' },
  { onek: 'hesap-plani-karti', ekran: 'hesap-plani' },
  { onek: 'muhasebe-entegrasyon-tanimlari', ekran: 'muhasebe-entegrasyon-tanimlari' },
  { onek: 'cari-hesap-fisi', ekran: 'cari-hesap-fisleri' },
  { onek: 'muhasebe-fisi', ekran: 'muhasebe-fisleri' },
  { onek: 'depo-karti', ekran: 'depo-tanimlari' },
  { onek: 'doviz-karti', ekran: 'doviz-tanimlari' },
  { onek: 'aksesuar-karti', ekran: 'aksesuar-kartlari' },
  { onek: 'hizmet-karti', ekran: 'hizmet-kartlari' },
  { onek: 'makina-karti', ekran: 'makina-kartlari' },
  { onek: 'iplik-karti', ekran: 'iplik-kartlari' },
  { onek: 'kumas-karti', ekran: 'kumas-kartlari' },
  { onek: 'marka-karti', ekran: 'marka-kartlari' },
  { onek: 'model-karti', ekran: 'model-kartlari' },
  { onek: 'renk-karti', ekran: 'renk-kartlari' },
  { onek: 'grup-karti', ekran: 'grup-kartlari' },
  { onek: 'rota-karti', ekran: 'rota-tanimlari' },
  { onek: 'gtip-karti', ekran: 'gtip-tanimlari' },
  { onek: 'beden-tanim', ekran: 'beden-tanimlari' },
  { onek: 'raf-karti', ekran: 'raf-tanimlari' },
  { onek: 'rol-karti', ekran: 'rol-yonetimi' },
].sort((a, b) => b.onek.length - a.onek.length)

function ekranBul(ekranKey: string): { modul: string; ekran: string } | null {
  for (const mod of modules) {
    if (mod.categories.some((cat) => cat.items.some((item) => item.key === ekranKey))) {
      return { modul: mod.key, ekran: ekranKey }
    }
  }
  return null
}

/** Sekmenin yetki kontrolünde kullanılacağı ekranı bulur; eşleşme yoksa null (kısıtsız). */
export function sekmeEkrani(tab: {
  key: string
  moduleKey?: string
  ekranAdi?: string
}): { modul: string; ekran: string } | null {
  if (tab.ekranAdi) {
    const bulunan = ekranBul(tab.ekranAdi)
    if (bulunan) return bulunan
  }
  const tam = ekranBul(tab.key)
  if (tam) return tam
  const onek = KART_ONEKLERI.find((o) => tab.key.startsWith(o.onek))
  return onek ? ekranBul(onek.ekran) : null
}
