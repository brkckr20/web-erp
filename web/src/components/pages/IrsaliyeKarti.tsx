'use client'

import { Input, InputNumber, DatePicker, Select, Button, App, Spin, Popconfirm, Tooltip, Popover, Checkbox, Modal, Dropdown, Tag, Switch } from 'antd'
import type { MenuProps } from 'antd'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community'
import type { ColDef, GridApi, CellFocusedEvent } from 'ag-grid-community'
import dayjs from 'dayjs'
import { PlusOutlined, DeleteOutlined, SettingOutlined, SearchOutlined } from '@ant-design/icons'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import SearchableCariSelect from '@/components/shared/SearchableCariSelect'
import SearchableDepoSelect from '@/components/shared/SearchableDepoSelect'
import SearchableMalzemeSelect from '@/components/shared/SearchableMalzemeSelect'
import SearchableRenkSelect from '@/components/shared/SearchableRenkSelect'
import { irsaliyeApi, type Irsaliye, type IrsaliyeKalem, type IrsaliyeFormData } from '@/lib/irsaliye-api'
import { islemApi, type Islem } from '@/lib/islem-api'
import { faturaApi } from '@/lib/fatura-api'
import { kaliteKontrolApi, type KaliteKontrolKalemDetay } from '@/lib/kalite-kontrol-api'
import { fasonTipiApi } from '@/lib/fason-tipi-api'
import { malzemeApi, type Malzeme } from '@/lib/malzeme-api'
import { cariHesapApi } from '@/lib/cari-hesap-api'
import { depoApi } from '@/lib/depo-api'
import { agGridLocaleTR } from '@/lib/ag-grid-locale'
import { kalemMiktari } from '@/lib/miktar'
import { kolonSecimiApi, type KolonKaydi } from '@/lib/kolon-secimi-api'
import { useAuth } from '@/context/AuthContext'
import RaporSecimModal from '@/components/shared/RaporSecimModal'

ModuleRegistry.registerModules([AllCommunityModule])

const antTheme = themeQuartz.withParams({
  fontFamily: 'inherit',
  fontSize: 12,
  foregroundColor: '#333',
  headerFontSize: 12,
  headerFontWeight: 600,
  headerTextColor: '#6b7280',
  headerBackgroundColor: '#f9fafb',
  headerColumnResizeHandleColor: '#e5e7eb',
  borderColor: '#f0f0f0',
  rowBorder: { style: 'solid', width: 1, color: '#f0f0f0' },
  columnBorder: false,
  rowHoverColor: '#fafafa',
  selectedRowBackgroundColor: '#FF9933',
  oddRowBackgroundColor: '#ffffff',
  backgroundColor: '#ffffff',
  cellHorizontalPadding: 10,
  wrapperBorder: { style: 'solid', width: 1, color: '#f0f0f0' },
  wrapperBorderRadius: 2,
  rangeSelectionBorderColor: 'transparent',
})

interface IrsaliyeKartiProps {
  irsaliyeTipi?: string
  fasonTipiId?: number | null
  id?: number
  ekranAdi?: string
  onDeleted?: (irsaliyeTipi: string) => void
  baslangicKalemler?: IrsaliyeBaslangicKalem[]
  /** 202'den 134 açılırken taşınan talimat id'si (kaydederken talimatId yazılır). */
  baslangicTalimatId?: number | null
  onCreateIrsaliye?: (irsaliyeTipi: string, kalemler: IrsaliyeBaslangicKalem[], fasonTipiId?: number | null, talimatId?: number | null) => void
  onCreateFatura?: (info: { faturaTipi: string; irsaliyeIds: number[]; fasonTipiId?: number | null }) => void
  onOpenFatura?: (info: { id: number; faturaTipi: string; faturaNo: string }) => void
  onOpenIrsaliye?: (info: { id: number; irsaliyeTipi: string; irsaliyeNo: string }) => void
}

export interface IrsaliyeBaslangicKalem {
  malzemeKod: string
  malzemeAd: string
  miktar: number
  birim: string
  birimFiyat?: number
  cariHesapKod?: string
  depoKod?: string
  aciklama: string
  siparisKalemId: number | null
  /** Parti/lot no (girişlerde girilir, aktarımda taşınır). */
  partiNo?: string | null
  /** Kaynak irsaliye kalem id'si (202→134 aktarımında 202'nin kalem id'si). */
  kaynakKalemId?: number | null
  /** Fason kumaş bilgileri: talimattan çıkışa taşınır. */
  istenenGram?: number | null
  ebat?: string | null
  topSayisi?: number | null
  boyahaneRenkId?: number | null
  boyahaneRenkKod?: string
  boyahaneRenkAd?: string
  varyant1RenkId?: number | null
  varyant1RenkKod?: string | null
  varyant1RenkAd?: string | null
  /** Birleşmiş satırın sipariş/model dağılımı (planlamadan gelir, salt-okunur). */
  tahsis?: KalemTahsis[]
  /** Satıra seçilen prosesler (sıralı). */
  prosesler?: KalemProses[]
}

/** 202 talimat satırındaki miktarın hangi sipariş/model ihtiyacından geldiği. */
export interface KalemTahsis {
  siparisKalemId: number | null
  siparisNo: string
  modelKod: string
  miktar: number
}

/** Satıra seçilen proses (İşlem kartı + satırdaki sıra). */
export interface KalemProses {
  islemId: number
  ad: string
  sira: number
}

/** Prosesleri sıraya göre 'ad, ad' metnine çevirir (grid + form görüntüleme). */
export function prosesAdlariGetir(prosesler: KalemProses[] | undefined): string {
  return [...(prosesler ?? [])].sort((a, b) => a.sira - b.sira).map((p) => p.ad).join(', ')
}

/**
 * Aynı kumaş + renk + partideki başlangıç kalemlerini tek satırda birleştirir (anahtar:
 * malzemeKod + varyant1RenkId + birim + partiNo), miktarları toplar, kaynakları tahsis
 * listesinde saklar. Tahsis salt-okunurdur; satır miktarı sonradan değişirse
 * Tahsis Detayları modalı farkı uyarı olarak gösterir.
 */
export function baslangicKalemleriBirlestir(kalemler: IrsaliyeBaslangicKalem[]): IrsaliyeBaslangicKalem[] {
  const gruplar = new Map<string, IrsaliyeBaslangicKalem>()
  for (const k of kalemler) {
    const anahtar = `${k.malzemeKod}||${k.varyant1RenkId ?? ''}||${k.birim}||${k.partiNo ?? ''}`
    const mevcut = gruplar.get(anahtar)
    if (!mevcut) {
      gruplar.set(anahtar, { ...k, tahsis: [...(k.tahsis ?? [])] })
      continue
    }
    mevcut.miktar = (Number(mevcut.miktar) || 0) + (Number(k.miktar) || 0)
    mevcut.tahsis = [...(mevcut.tahsis ?? []), ...(k.tahsis ?? [])]
    const parcalar = [...(mevcut.aciklama ?? '').split(' + '), ...(k.aciklama ?? '').split(' + ')].filter(Boolean)
    mevcut.aciklama = [...new Set(parcalar)].join(' + ')
    if (mevcut.siparisKalemId !== k.siparisKalemId) mevcut.siparisKalemId = null
    if (mevcut.kaynakKalemId !== k.kaynakKalemId) mevcut.kaynakKalemId = null
    // Prosesler birleşir (aynı proses teklenir, ilk görülen sıra korunur).
    for (const p of k.prosesler ?? []) {
      if (!(mevcut.prosesler ?? []).some((x) => x.islemId === p.islemId)) {
        mevcut.prosesler = [...(mevcut.prosesler ?? []), { ...p }]
      }
    }
  }
  return [...gruplar.values()]
}

interface KalemRow {
  key: string
  /** Kalem satırının kalıcı kimliği (DB uuid). Kayıtta korunur → FK bağları bozulmaz. */
  uuid: string | null
  tip: string
  malzemeKod: string
  malzemeAd: string
  barkod: string
  partiNo: string
  brutKg: number
  kg: number
  brutMt: number
  mt: number
  adet: number
  hesapBirimi: string
  birimFiyat: number
  doviz: string
  kdv: number
  /** Fiyat KDV dahil mi girildi? İskonto matraha göre uygulanır. */
  kdvDahil: boolean
  /** Satır iskontosu: oran (%) ve/veya tutar (₺). Biri girilince diğeri hesaplanır. */
  iskontoOrani: number
  iskontoTutari: number
  satirTutari: number
  aciklama: string
  siparisKalemId: number | null
  /** Satırın kendi DB id'si (kayıtlı fişlerde; aktarımda kaynak id olur). */
  kalemId: number | null
  /** Kaynak irsaliye kalem id'si (bu satır hangi satırdan üretildi). */
  kaynakKalemId: number | null
  /** Fason kumaş bilgileri: istenen gramaj, ebat, top sayısı. */
  istenenGram: number
  ebat: string
  topSayisi: number
  /** Boyahane Renk Kartı (Renk.tip=2): fason hedef rengi. varyant2 = desen (sonraki aşama). */
  boyahaneRenkId: number | null
  boyahaneRenkKod: string
  boyahaneRenkAd: string
  varyant1RenkId: number | null
  varyant1RenkKod: string
  varyant1RenkAd: string
  fire: number | null
  /** Kalite kontrol gerekmez mi? (11-Fasondan Giriş). true ise kalem "Kalite Bekleyen" listesine girmez. */
  kaliteYapilmayacak: boolean
  /** Birleşmiş satırın sipariş/model dağılımı (salt-okunur tahsis detayı). */
  tahsis: KalemTahsis[]
  /** Satıra seçilen prosesler (sıralı). */
  prosesler: KalemProses[]
}

const emptyKalem = (): KalemRow => ({
  key: Math.random().toString(36).slice(2),
  uuid: null,
  tip: 'Malzeme',
  malzemeKod: '',
  malzemeAd: '',
  barkod: '',
  partiNo: '',
  brutKg: 0,
  kg: 0,
  brutMt: 0,
  mt: 0,
  adet: 0,
  hesapBirimi: 'kg',
  birimFiyat: 0,
  doviz: 'TL',
  kdv: 0,
  kdvDahil: false,
  iskontoOrani: 0,
  iskontoTutari: 0,
  satirTutari: 0,
  aciklama: '',
  siparisKalemId: null,
  boyahaneRenkId: null,
  boyahaneRenkKod: '',
  boyahaneRenkAd: '',
  varyant1RenkId: null,
  varyant1RenkKod: '',
  varyant1RenkAd: '',
  fire: null,
  kaliteYapilmayacak: false,
  tahsis: [],
  kalemId: null,
  kaynakKalemId: null,
  istenenGram: 0,
  ebat: '',
  topSayisi: 0,
  prosesler: [],
})

const irsaliyeTipiMap: Record<string, string> = {
  '2': '2-Perakende Satış İade İrsaliyesi',
  '3': '3-Toptan Satış İade İrsaliyesi',
  '4': '4-Konsinye Çıkış İade İrsaliyesi',
  '8': '8-Konsinye Satır İrsaliyesi',
  '12': '12-Fason Çıkış İade İrsaliyesi',
  '23': '23-Verilen Hizmet İadesi',
  '120': '120-Toptan Satış İrsaliyesi',
  '121': '121-Perakende Satır İrsaliyesi',
  '123': '123-Konsinye Çıkış İrsaliyesi',
  '125': '125-Fason Giriş İrsaliyesi',
  '126': '126-Verilen Fiyat Farkı İrsaliyesi',
  '134': '134-Fasona Çıkış İrsaliyesi',
  '138': '138-Verilen Hizmet İrsaliyesi',
  '192': '192-Serbest Meslek Makbuzu',
  '201': '201-Satın Alma Siparişi',
  '202': '202-Fason Talimatı',
}

// Fason fişleri: miktarlar brüt/net ayrı girilir (fasoncu brüt üzerinden çalışır).
// 202-Fason Talimatı da miktarlı bir belgedir, aynı kolonları kullanır.
const fasonFisTipleri = ['6', '11', '12', '125', '133', '134', '202']

// "Fason Gidenler (134)" listesindeki satır: 134 kalemi + kalan miktar.
type FasonGidenSatir = IrsaliyeKalem & {
  fisNo: string
  belgeNo: string
  tarih: string | null
  cariAd: string
  fasonTipiAd: string
  /** Kalan = 134.brüt − Σ(bu kaleme bağlı 11'lerin brütü) */
  kalan: number
}
const uretimKolonlari = ['tip', 'barkod', 'brutKg', 'kg', 'brutMt', 'mt', 'adet', 'hesapBirimi', 'istenenGram', 'ebat', 'topSayisi', 'prosesler']
const satinalmaSiparisKolonlari = ['tip', 'barkod', 'istenenGram', 'ebat', 'topSayisi', 'prosesler']
const defaultHiddenColsFor = (irsaliyeTipi: string): Set<string> => {
  const gizle = new Set<string>()
  if (irsaliyeTipi === '201') {
    satinalmaSiparisKolonlari.forEach((k) => gizle.add(k))
    return gizle
  }
  // Top Sayısı 202-Talimat'ta kullanılmaz (134/11'de girilir).
  if (irsaliyeTipi === '202') gizle.add('topSayisi')
  if (!fasonFisTipleri.includes(irsaliyeTipi)) {
    uretimKolonlari.forEach((k) => gizle.add(k))
  }
  return gizle
}

const formatTR = (v: number) => {
  if (v === 0) return ''
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
}

const parseTR = (s: string) => {
  if (!s) return 0
  return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
}

const formatTarih = (d: string | null) => {
  if (!d) return '-'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '-'
  return dt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function TurkishNumberInput({ value, onChange, className, onEnter }: { value: number; onChange: (v: number) => void; className?: string; onEnter?: () => void }) {
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState('')

  const display = focused ? draft : formatTR(value)

  return (
    <Input
      size="small"
      type="text"
      value={display}
      onFocus={() => {
        setFocused(true)
        setDraft(value === 0 ? '' : String(value).replace('.', ','))
      }}
      onBlur={() => {
        setFocused(false)
        onChange(parseTR(draft))
      }}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          onChange(parseTR(draft))
          onEnter?.()
        }
      }}
      className={className}
    />
  )
}

const numberFormat = (v: number) => (v ?? 0).toFixed(2)

function CellTextInput({
  value,
  onCommit,
  onEnter,
  className,
}: {
  value: string
  onCommit: (v: string) => void
  onEnter?: () => void
  className?: string
}) {
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState('')
  const display = focused ? draft : value

  return (
    <Input
      size="small"
      value={display}
      onFocus={() => {
        setFocused(true)
        setDraft(value)
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setFocused(false)
        if (draft !== value) onCommit(draft)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          if (draft !== value) onCommit(draft)
          onEnter?.()
        }
      }}
      className={className}
    />
  )
}

export default function IrsaliyeKarti({ irsaliyeTipi = '120', fasonTipiId, id: propId, ekranAdi, onDeleted, baslangicKalemler, baslangicTalimatId, onCreateIrsaliye, onCreateFatura, onOpenFatura, onOpenIrsaliye }: IrsaliyeKartiProps) {
  const { message } = App.useApp()
  const { modal } = App.useApp()
  const { kullanici } = useAuth()
  const kayitYapan = kullanici ? `${kullanici.kod} - ${kullanici.ad}` : null
  const irsaliyeTipiLabel = irsaliyeTipiMap[irsaliyeTipi] || irsaliyeTipi
  const [localId, setLocalId] = useState<number | undefined>(propId)
  const id = localId

  const [fasonTipiAd, setFasonTipiAd] = useState('')
  const [fasonTipiKayit, setFasonTipiKayit] = useState<number | null>(fasonTipiId ?? null)
  const [fasonTipleri, setFasonTipleri] = useState<{ id: number; ad: string }[]>([])

  const [irsaliyeNo, setIrsaliyeNo] = useState('')
  const [cariKod, setCariKod] = useState<string>(() => baslangicKalemler?.[0]?.cariHesapKod ?? '')
  const [depoKod, setDepoKod] = useState<string>(() => baslangicKalemler?.[0]?.depoKod ?? '')
  const [irsaliyeTarihi, setIrsaliyeTarihi] = useState(dayjs())
  const [sevkTarihi, setSevkTarihi] = useState<dayjs.Dayjs | null>(null)
  // 201-Yeni kayıtta Termin Tarihi bugünü default alır.
  const [terminTarihi, setTerminTarihi] = useState<dayjs.Dayjs | null>(() => (irsaliyeTipi === '201' && !propId ? dayjs() : null))
  const [belgeNo, setBelgeNo] = useState('')
  const [bagliFaturaNo, setBagliFaturaNo] = useState('')
  const [talimatId, setTalimatId] = useState<number | null>(null)
  const [talimatNo, setTalimatNo] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [yetkili, setYetkili] = useState('')
  const [onaylandi, setOnaylandi] = useState(false)
  const [tamamlandi, setTamamlandi] = useState(false)
  const [kalemler, setKalemler] = useState<KalemRow[]>(() =>
    !id && baslangicKalemler && baslangicKalemler.length > 0
      ? baslangicKalemler.map((b) => {
          const row = { ...emptyKalem(), malzemeKod: b.malzemeKod, malzemeAd: b.malzemeAd, hesapBirimi: 'mt', aciklama: b.aciklama ?? '', partiNo: b.partiNo ?? '', birimFiyat: b.birimFiyat ?? 0, siparisKalemId: b.siparisKalemId ?? null, kaynakKalemId: b.kaynakKalemId ?? null, istenenGram: b.istenenGram ?? 0, ebat: b.ebat ?? '', topSayisi: b.topSayisi ?? 0, boyahaneRenkId: b.boyahaneRenkId ?? null, boyahaneRenkKod: b.boyahaneRenkKod ?? '', boyahaneRenkAd: b.boyahaneRenkAd ?? '', varyant1RenkId: b.varyant1RenkId ?? null, varyant1RenkKod: b.varyant1RenkKod ?? '', varyant1RenkAd: b.varyant1RenkAd ?? '', tahsis: b.tahsis ?? [], prosesler: b.prosesler ?? [] }
          const val = b.miktar || 0
          if (b.birim === 'kg') { row.kg = val; row.hesapBirimi = 'kg' }
          else if (b.birim === 'adet') { row.adet = val; row.hesapBirimi = 'adet' }
          else { row.mt = val; row.hesapBirimi = 'mt' }
          return row
        })
      : [],
  )
  const [loading, setLoading] = useState<boolean>(() => Boolean(propId))
  const [raporModalAcik, setRaporModalAcik] = useState(false)
  const gridApiRef = useRef<GridApi<KalemRow> | null>(null)
  // Sağ tık menüsü hangi satırda açıldıysa Tahsis Detayları onu gösterir (yoksa seçili satır).
  const [sagTikSatir, setSagTikSatir] = useState<KalemRow | null>(null)
  const [tahsisSatir, setTahsisSatir] = useState<KalemRow | null>(null)
  // Satıra proses (İşlem, tip=2) seçimi modalı. Sıra modalde seçilir.
  const [prosesSatir, setProsesSatir] = useState<KalemRow | null>(null)
  const [prosesListesi, setProsesListesi] = useState<Islem[]>([])
  const [prosesSecili, setProsesSecili] = useState<number[]>([])
  const [prosesSiralar, setProsesSiralar] = useState<Record<number, number>>({})

  // "Barkod Detayları": 11 kalemine bağlı KK topları (salt-okunur).
  const [barkodDetayOpen, setBarkodDetayOpen] = useState(false)
  const [barkodDetayLoading, setBarkodDetayLoading] = useState(false)
  const [barkodDetayRows, setBarkodDetayRows] = useState<KaliteKontrolKalemDetay[]>([])
  const [barkodDetayKalem, setBarkodDetayKalem] = useState<KalemRow | null>(null)

  const openBarkodDetay = () => {
    const hedef = sagTikSatir ?? gridApiRef.current?.getSelectedRows()?.[0] ?? null
    if (!hedef) {
      message.warning('Önce bir satıra sağ tıklayın')
      return
    }
    if (hedef.kalemId == null) {
      message.warning('Barkod detayları için fişi önce kaydedin')
      return
    }
    setBarkodDetayKalem(hedef)
    setBarkodDetayOpen(true)
    setBarkodDetayLoading(true)
    kaliteKontrolApi
      .irsaliyeKalemDetay(hedef.kalemId)
      .then((rows) => setBarkodDetayRows(rows ?? []))
      .catch((err) => {
        setBarkodDetayRows([])
        message.error('Barkod detayları alınamadı: ' + (err?.message || err))
      })
      .finally(() => setBarkodDetayLoading(false))
  }

  const barkodDetayKolonlar: ColDef<KaliteKontrolKalemDetay>[] = [
    { headerName: 'Barkod', field: 'barkod', width: 130, valueFormatter: (p) => p.value || '-' },
    { headerName: 'Top No', field: 'topNo', width: 80, type: 'rightAligned', valueFormatter: (p) => (p.value ? String(p.value) : '-') },
    { headerName: 'KK Fiş No', field: 'fisNo', width: 100, cellClass: '!text-[#f57c00] !font-medium' },
    { headerName: 'Tarih', field: 'fisTarihi', width: 100, valueFormatter: (p) => formatTarih(p.value) },
    { headerName: 'Kullanıcı', field: 'kayitYapan', width: 120, valueFormatter: (p) => p.value || '-' },
    { headerName: 'Kg', field: 'netAgirlik', width: 90, type: 'rightAligned', valueFormatter: (p) => formatTR(Number(p.value) || 0) },
    { headerName: 'Mt', field: 'netMetre', width: 90, type: 'rightAligned', valueFormatter: (p) => formatTR(Number(p.value) || 0) },
    { headerName: 'Adet', field: 'adet', width: 80, type: 'rightAligned', valueFormatter: (p) => (p.value ? String(p.value) : '') },
    {
      headerName: 'Hatalar', flex: 1, minWidth: 220,
      valueFormatter: (p) => {
        const hatalar = p.data?.hatalar ?? []
        if (hatalar.length === 0) return '—'
        return hatalar.map((h) => `${h.hataAdi} ${h.miktar ?? 1}`).join(', ')
      },
      tooltipValueGetter: (p) => (p.data?.hatalar ?? []).map((h) => `${h.hataAdi} ${h.miktar ?? 1}`).join(', ') || '—',
    },
  ]

  const openProsesler = () => {
    const hedef = sagTikSatir ?? gridApiRef.current?.getSelectedRows()?.[0] ?? null
    if (!hedef || !hedef.malzemeKod) {
      message.warning('Önce bir satır seçin (satıra tıklayıp sağ tık menüsünü açın)')
      return
    }
    setProsesSatir(hedef)
    // Proses Tanımları (tip=2) listelenir.
    islemApi
      .list(2)
      .then((liste) => {
        const aktifler = (liste ?? []).filter((x) => x.aktif !== false)
        setProsesListesi(aktifler)
        const mevcut = [...(hedef.prosesler ?? [])].sort((a, b) => a.sira - b.sira)
        // Bayat seçim temizliği: silinmiş kartlar listede yoksa seçimden düşer.
        const listede = new Set(aktifler.map((x) => x.id))
        const gecerliMevcut = mevcut.filter((p) => listede.has(p.islemId))
        if (gecerliMevcut.length > 0) {
          // Satırda kayıtlı proses varsa aynen gelir.
          setProsesSecili(gecerliMevcut.map((p) => p.islemId))
          const siralar: Record<number, number> = {}
          gecerliMevcut.forEach((p, i) => { siralar[p.islemId] = p.sira || i + 1 })
          setProsesSiralar(siralar)
        } else {
          // Boş satırda kartta "varsayılan" işaretliler seçili gelir (kart sırasına göre).
          const varsayilanlar = aktifler.filter((x) => x.varsayilan === true)
          setProsesSecili(varsayilanlar.map((x) => x.id))
          const siralar: Record<number, number> = {}
          varsayilanlar.forEach((x, i) => { siralar[x.id] = i + 1 })
          setProsesSiralar(siralar)
        }
      })
      .catch(() => setProsesListesi([]))
  }

  /** Proses satırı switch ile açılıp kapatılır (yeni açılana listedeki seçim sırası verilir). */
  const toggleProses = (id: number, checked: boolean) => {
    setProsesSecili((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id]
      return prev.filter((x) => x !== id)
    })
    setProsesSiralar((prev) => {
      const next = { ...prev }
      if (checked) {
        if (!next[id]) {
          const max = Object.values(next).reduce((m, v) => Math.max(m, v), 0)
          next[id] = max + 1
        }
      } else {
        delete next[id]
      }
      return next
    })
  }

  const handleProsesKaydet = () => {
    if (!prosesSatir) return
    const adMap = new Map(prosesListesi.map((x) => [x.id, x.ad]))
    const prosesler: KalemProses[] = prosesSecili.map((id) => ({
      islemId: id,
      ad: adMap.get(id) ?? '',
      sira: prosesSiralar[id] ?? 0,
    })).filter((p) => p.ad)
    prosesler.sort((a, b) => a.sira - b.sira)
    // Sıralar 1..n'e normalize edilir.
    prosesler.forEach((p, i) => { p.sira = i + 1 })
    updateKalem(prosesSatir.key, { prosesler })
    setProsesSatir(null)
  }

  const openTahsisDetay = () => {
    const hedef = sagTikSatir ?? gridApiRef.current?.getSelectedRows()?.[0] ?? null
    if (!hedef || !hedef.malzemeKod) {
      message.warning('Önce bir satır seçin (satıra tıklayıp sağ tık menüsünü açın)')
      return
    }
    setTahsisSatir(hedef)
  }

  useEffect(() => {
    let cancelled = false
    if (propId) {
      irsaliyeApi
        .get(propId)
        .then((i) => {
          if (cancelled) return
          setIrsaliyeNo(i.irsaliyeNo)
          if (i.irsaliyeTarihi) setIrsaliyeTarihi(dayjs(i.irsaliyeTarihi))
           if (i.sevkTarihi) setSevkTarihi(dayjs(i.sevkTarihi))
           if (i.terminTarihi) setTerminTarihi(dayjs(i.terminTarihi))
           // Eski 201 kayıtları tarihi sevk_tarihi'ne yazıyordu; termin boşsa oradan devral.
           else if (irsaliyeTipi === '201' && i.sevkTarihi) setTerminTarihi(dayjs(i.sevkTarihi))
          setBelgeNo(i.sevkNo ?? '')
          setBagliFaturaNo(i.faturaNo ?? '')
          const tid = (i as Irsaliye).talimatId ?? null
          setTalimatId(tid)
          setTalimatNo('')
          if (tid) {
            irsaliyeApi
              .get(tid)
              .then((t) => { if (!cancelled) setTalimatNo(t.irsaliyeNo ?? '') })
              .catch(() => {})
          }
          setAciklama(i.aciklama ?? '')
          setYetkili((i as Irsaliye).yetkili ?? '')
          setOnaylandi(!!i.onaylandi)
          setTamamlandi(!!i.tamamlandi)
          setFasonTipiKayit((i as Irsaliye).fasonTipiId ?? null)
          setFasonTipiAd((i as Irsaliye).fasonTipi?.ad ?? '')
          setCariKod((i as Irsaliye).cariHesap?.kod ?? String((i as Irsaliye).cariHesapId ?? ''))
          setDepoKod((i as Irsaliye).depo?.kod ?? String((i as Irsaliye).depoId ?? ''))
          const kalemList = (i as Irsaliye).kalemler ?? []
          const rows: KalemRow[] = kalemList.map((k) => ({
            key: Math.random().toString(36).slice(2),
            uuid: (k as IrsaliyeKalem).uuid ?? null,
            tip: (k as IrsaliyeKalem).tip ?? 'Malzeme',
            malzemeKod: (k as IrsaliyeKalem).malzeme?.kod ?? (k.malzemeId != null ? String(k.malzemeId) : ''),
            malzemeAd: (k as IrsaliyeKalem).malzeme?.ad ?? '',
            barkod: (k as IrsaliyeKalem).takipNo ?? (k as IrsaliyeKalem).malzeme?.barkod ?? '',
            partiNo: (k as IrsaliyeKalem).partiNo ?? '',
            brutKg: Number((k as IrsaliyeKalem).brutAgirlik) || 0,
            kg: Number((k as IrsaliyeKalem).netAgirlik) || 0,
            brutMt: Number((k as IrsaliyeKalem).brutMetre) || 0,
            mt: Number((k as IrsaliyeKalem).netMetre) || 0,
            adet: Number((k as IrsaliyeKalem).adet) || 0,
            hesapBirimi: (k as IrsaliyeKalem).olcuBirimi || 'kg',
            birimFiyat: Number(k.birimFiyat) || 0,
            doviz: (k as IrsaliyeKalem).doviz || 'TL',
            kdv: Number(k.kdv) || 0,
            kdvDahil: (k as IrsaliyeKalem).kdvDahil ?? false,
            iskontoOrani: Number((k as IrsaliyeKalem).iskontoOrani) || 0,
            iskontoTutari: Number((k as IrsaliyeKalem).iskontoTutari) || 0,
            satirTutari: Number(k.satirTutari) || 0,
            aciklama: k.aciklama ?? '',
            siparisKalemId: (k as IrsaliyeKalem).siparisKalemId ?? null,
            kalemId: k.id ?? null,
            kaynakKalemId: (k as IrsaliyeKalem).kaynakKalemId ?? null,
            istenenGram: Number((k as IrsaliyeKalem).istenenGram) || 0,
            ebat: (k as IrsaliyeKalem).ebat ?? '',
            topSayisi: Number((k as IrsaliyeKalem).topSayisi) || 0,
            boyahaneRenkId: (k as IrsaliyeKalem).boyahaneRenkId ?? (k as IrsaliyeKalem).boyahaneRenk?.id ?? null,
            boyahaneRenkKod: (k as IrsaliyeKalem).boyahaneRenk?.kod ?? '',
            boyahaneRenkAd: (k as IrsaliyeKalem).boyahaneRenk?.ad ?? '',
            varyant1RenkId: (k as IrsaliyeKalem).varyant1RenkId ?? (k as IrsaliyeKalem).varyant1Renk?.id ?? null,
            varyant1RenkKod: (k as IrsaliyeKalem).varyant1Renk?.kod ?? '',
            varyant1RenkAd: (k as IrsaliyeKalem).varyant1Renk?.ad ?? '',
            fire: (k as IrsaliyeKalem).fire != null ? Number((k as IrsaliyeKalem).fire) : null,
            kaliteYapilmayacak: !!(k as IrsaliyeKalem).kaliteYapilmayacak,
            tahsis: ((k as IrsaliyeKalem).tahsisler ?? []).map((t) => ({
              siparisKalemId: t.siparisKalemId ?? null,
              siparisNo: t.siparisNo ?? '',
              modelKod: t.modelKod ?? '',
              miktar: Number(t.miktar) || 0,
            })),
            ...(() => {
              const il = ((k as IrsaliyeKalem).islemler ?? [])
                .map((x, i) => ({ islemId: x.islem?.id ?? x.islemId ?? 0, ad: x.islem?.ad ?? '', sira: (x as { sira?: number }).sira ?? i + 1 }))
                .filter((x) => x.islemId > 0 && x.ad)
              il.sort((a, b) => a.sira - b.sira)
              return { prosesler: il }
            })(),
          }))
          setKalemler(rows.length > 0 ? rows : [])
        })
        .catch((err) => message.error('İrsaliye yüklenemedi: ' + (err?.message || err)))
        .finally(() => { if (!cancelled) setLoading(false) })
    } else {
      irsaliyeApi
        .nextIrsaliyeNo(irsaliyeTipi)
        .then((res) => setIrsaliyeNo(res.irsaliyeNo))
        .catch(() => setIrsaliyeNo('00000001'))
    }
    return () => { cancelled = true }
  }, [propId, irsaliyeTipi, message])

  useEffect(() => {
    setLocalId(propId)
  }, [propId])

  useEffect(() => {
    if (!id && fasonTipiId) {
      fasonTipiApi
        .get(fasonTipiId)
        .then((f) => setFasonTipiAd(f.ad))
        .catch(() => {})
    }
  }, [id, fasonTipiId])

  // Fason Talimatı (202) alt tipini kullanıcı seçer -> seçenek listesi gerekir
  useEffect(() => {
    if (irsaliyeTipi !== '202') return
    fasonTipiApi
      .list()
      .then((list) => setFasonTipleri(list.filter((f) => f.kullanimda).map((f) => ({ id: f.id, ad: f.ad }))))
      .catch(() => setFasonTipleri([]))
  }, [irsaliyeTipi])

  const hesapMiktariGetir = (k: KalemRow): number => {
    // Kartlardan büyük/küçük harf karışık gelebilir ('Adet' vs 'adet') → normalize et.
    switch (String(k.hesapBirimi ?? '').toLowerCase()) {
      case 'brutkg': return k.brutKg || 0
      case 'kg': return k.kg || 0
      case 'brutmt': return k.brutMt || 0
      case 'mt': return k.mt || 0
      case 'adet': return k.adet || 0
      default: return 0
    }
  }

  const updateKalem = (key: string, patch: Partial<KalemRow>) => {
    setKalemler((prev) =>
      prev.map((k) => {
        if (k.key !== key) return k
        const next = { ...k, ...patch }
        // İskonto oranı girilip tutar girilmediyse orandan tutarı türet (ve tersi).
        if ('iskontoOrani' in patch && !('iskontoTutari' in patch)) {
          const brutMatrah = hesapMiktariGetir(next) * (next.birimFiyat || 0)
          next.iskontoTutari = (next.iskontoOrani || 0) > 0 ? brutMatrah * (next.iskontoOrani || 0) / 100 : 0
        } else if ('iskontoTutari' in patch && !('iskontoOrani' in patch)) {
          const brutMatrah = hesapMiktariGetir(next) * (next.birimFiyat || 0)
          next.iskontoOrani = brutMatrah > 0 ? (next.iskontoTutari || 0) / brutMatrah * 100 : 0
        }
        next.satirTutari = satirHesapla(next).satirTutari
        return next
      }),
    )
  }

  // Satır hesabı: iskonto matrahtan (KDV'den önce) düşülür.
  // kdvDahil=false → fiyat matrah; iskonto matrahtan. kdvDahil=true → fiyat KDV dahil;
  // iskonto KDV dahil tutardan düşülür, sonra KDV ayrıştırılır.
  const satirHesapla = (k: KalemRow) => {
    const miktar = hesapMiktariGetir(k)
    const kdvOran = k.kdv || 0
    if (k.kdvDahil) {
      const brutDahil = miktar * (k.birimFiyat || 0)
      const iskonto = k.iskontoTutari || 0
      const netDahil = Math.max(brutDahil - iskonto, 0)
      const matrah = netDahil / (1 + kdvOran / 100)
      return { matrah, kdv: netDahil - matrah, satirTutari: netDahil }
    }
    const brutMatrah = miktar * (k.birimFiyat || 0)
    const iskonto = k.iskontoTutari || 0
    const matrah = Math.max(brutMatrah - iskonto, 0)
    const kdv = matrah * kdvOran / 100
    return { matrah, kdv, satirTutari: matrah + kdv }
  }

  const addKalem = () => setKalemler((prev) => [...prev, emptyKalem()])
  const removeKalem = (key: string) =>
    setKalemler((prev) => {
      if (prev.length > 1) return prev.filter((k) => k.key !== key)
      return prev.map((k) => (k.key === key ? { ...emptyKalem(), key: k.key } : k))
    })

  const addKalemAndFocusMalzeme = () => {
    let newIndex = 0
    setKalemler((prev) => {
      newIndex = prev.length
      return [...prev, emptyKalem()]
    })
    setTimeout(() => focusCellEditor('malzemeKod', newIndex), 50)
  }

  const handleKaydet = async () => {
    if (!cariKod) {
      message.warning('Cari hesap zorunludur')
      return
    }
    const gecerliKalemler = kalemler.filter((k) => k.malzemeKod)
    if (gecerliKalemler.length === 0) {
      message.warning('En az bir malzeme kalemi girilmelidir')
      return
    }

    setLoading(true)
    try {
      const [cariHesapRecord, depoRecord, malzemeList] = await Promise.all([
        cariKod ? cariHesapApi.getByKod(cariKod) : Promise.resolve(null),
        depoKod ? depoApi.getByKod(depoKod) : Promise.resolve(null),
        malzemeApi.list(),
      ])
      const cariHesapId = cariHesapRecord?.id ?? null
      const depoId = depoRecord?.id ?? null
      const kalemPayload = gecerliKalemler.map((k) => ({
        // uuid kalem satırının kalıcı kimliğidir; kayıtta korunur (sunucu eşleştirir).
        uuid: k.uuid ?? null,
        malzemeId: malzemeList.find((m) => m.kod === k.malzemeKod)?.id ?? null,
        tip: k.tip || null,
        takipNo: k.barkod || null,
        partiNo: k.partiNo || null,
        brutAgirlik: k.brutKg,
        netAgirlik: k.kg,
        brutMetre: k.brutMt,
        netMetre: k.mt,
        adet: k.adet,
        olcuBirimi: k.hesapBirimi || null,
        miktar: hesapMiktariGetir(k),
        birimFiyat: k.birimFiyat,
        doviz: k.doviz || 'TL',
        kdv: k.kdv || null,
        kdvDahil: k.kdvDahil,
        iskontoOrani: k.iskontoOrani || null,
        iskontoTutari: k.iskontoTutari || null,
        satirTutari: k.satirTutari,
        aciklama: k.aciklama || null,
        siparisKalemId: k.siparisKalemId,
        kaynakKalemId: k.kaynakKalemId ?? null,
        istenenGram: k.istenenGram || null,
        ebat: k.ebat || null,
        topSayisi: k.topSayisi || null,
        boyahaneRenkId: k.boyahaneRenkId,
        varyant1RenkId: k.varyant1RenkId,
        kaliteYapilmayacak: k.kaliteYapilmayacak,
        prosesler: (k.prosesler ?? []).map((p) => ({ islemId: p.islemId, sira: p.sira })),
        tahsisler: k.tahsis,
      })) as IrsaliyeKalem[]

      if (id) {
        await irsaliyeApi.update(id, {
          irsaliyeTarihi: irsaliyeTarihi.format('YYYY-MM-DD'),
          sevkTarihi: sevkTarihi ? sevkTarihi.format('YYYY-MM-DD') : null,
          terminTarihi: terminTarihi ? terminTarihi.format('YYYY-MM-DD') : null,
          sevkNo: belgeNo || null,
          onaylandi,
          // Stok oynatan tipler kayıtta tamamlandi alır (oluşturmadaki kural güncellemede de geçerli).
          tamamlandi: ['1','2','3','4','5','8','9','11','12','120','121','122','123','124','134'].includes(irsaliyeTipi) ? true : tamamlandi,
          aciklama: aciklama || null,
          cariHesapId,
          depoId,
          fasonTipiId: fasonTipiKayit,
          yetkili: yetkili || null,
          guncelleyen: kayitYapan,
          kalemler: kalemPayload,
         } as Irsaliye)
      message.success('İrsaliye güncellendi')
    } else {
      const created = await irsaliyeApi.create({
        irsaliyeNo,
        irsaliyeTipi,
        irsaliyeTarihi: irsaliyeTarihi.format('YYYY-MM-DD'),
        sevkTarihi: sevkTarihi ? sevkTarihi.format('YYYY-MM-DD') : null,
        terminTarihi: terminTarihi ? terminTarihi.format('YYYY-MM-DD') : null,
        sevkNo: belgeNo || null,
        onaylandi,
        tamamlandi: ['1','2','3','4','5','8','9','11','12','120','121','122','123','124','134'].includes(irsaliyeTipi) ? true : tamamlandi,
        aciklama: aciklama || null,
        cariHesapId,
        depoId,
        fasonTipiId: fasonTipiKayit,
        yetkili: yetkili || null,
        kayitYapan,
        // 202'den açılan 134: kaynak talimatın id'si yazılır.
        talimatId: irsaliyeTipi === '134' ? (baslangicTalimatId ?? null) : null,
        kalemler: kalemPayload,
      } as IrsaliyeFormData & { kalemler: IrsaliyeKalem[] })
      setLocalId(created.id)
      // 134 yeni kaydedildiyse talimat rozeti hemen görünsün.
      if (irsaliyeTipi === '134' && baslangicTalimatId) {
        setTalimatId(baslangicTalimatId)
        irsaliyeApi
          .get(baslangicTalimatId)
          .then((t) => setTalimatNo(t.irsaliyeNo ?? ''))
          .catch(() => {})
      }
      message.success('İrsaliye ve kalemler kaydedildi')
    }
  } catch (err: unknown) {
    message.error('Hata: ' + ((err as Error)?.message ?? String(err)))
  } finally {
    setLoading(false)
    }
  }

  const handleFaturaAc = async () => {
    if (!bagliFaturaNo) return
    try {
      const f = await faturaApi.byNo(irsaliyeTipi, bagliFaturaNo)
      onOpenFatura?.({ id: f.id, faturaTipi: f.faturaTipi, faturaNo: f.faturaNo })
    } catch {
      message.warning('Bağlı fatura bulunamadı')
    }
  }

  const handleTalimatAc = () => {
    if (!talimatId) return
    onOpenIrsaliye?.({ id: talimatId, irsaliyeTipi: '202', irsaliyeNo: talimatNo })
  }

  const handleSil = () => {
    if (!id) {
      message.warning('Önce kaydedilmiş bir irsaliye olmalı')
      return
    }
    modal.confirm({
      title: 'İrsaliyeyi Sil',
      content: `${irsaliyeTipiLabel} - ${irsaliyeNo} irsaliyesini silmek istediğinize emin misiniz?`,
      okText: 'Evet, sil',
      okButtonProps: { danger: true },
      cancelText: 'Vazgeç',
      onOk: async () => {
        try {
          await irsaliyeApi.remove(id)
          message.success('İrsaliye silindi')
          onDeleted?.(irsaliyeTipi)
         } catch (err: unknown) {
           message.error('İrsaliye silinirken hata: ' + ((err as Error)?.message ?? String(err)))
        }
      },
    })
  }

  const focusCellEditor = (colId: string, rowIndex: number) => {
    const tryFocus = (attempt = 0) => {
      const cell = document.querySelector<HTMLElement>(
        `.kalemler-grid .ag-row[row-index="${rowIndex}"] .ag-cell[col-id="${colId}"]`,
      )
      const focusable = cell?.querySelector<HTMLElement>(
        'input:not([type="hidden"]), textarea, .ant-select-selector',
      )
      if (focusable) {
        const realInput =
          focusable.classList.contains('ant-select-selector')
            ? (focusable.closest('.ant-select')?.querySelector<HTMLElement>('input') ?? focusable)
            : focusable
        realInput.focus({ preventScroll: true })
        if (realInput instanceof HTMLInputElement) realInput.select?.()
        if (document.activeElement !== realInput && attempt < 15) {
          requestAnimationFrame(() => tryFocus(attempt + 1))
        }
      } else if (attempt < 15) {
        requestAnimationFrame(() => tryFocus(attempt + 1))
      }
    }
    requestAnimationFrame(() => tryFocus())
  }

  const focusNextCell = (currentColId: string, rowIndex: number) => {
    const editableCols = colDefs.map((c) => c.field as string).filter((f) => f && f !== 'key' && f !== 'malzemeAd' && f !== 'varyant1RenkAd')
    const idx = editableCols.indexOf(currentColId)
    if (idx === -1) return
    if (idx < editableCols.length - 1) {
      const nextCol = editableCols[idx + 1]
      gridApiRef.current?.setFocusedCell(rowIndex, nextCol)
      focusCellEditor(nextCol, rowIndex)
    } else {
      const firstCol = editableCols[0]
      const nextRow = rowIndex + 1
      if (nextRow < kalemler.length) {
        gridApiRef.current?.setFocusedCell(nextRow, firstCol)
        focusCellEditor(firstCol, nextRow)
      }
    }
  }

  const colDefs = useMemo<ColDef<KalemRow>[]>(() => [
    {
      headerName: '', field: 'key', width: 40, minWidth: 40, maxWidth: 40,
      resizable: false, sortable: false, filter: false, cellClass: '!p-0',
      cellRenderer: (p: { data: KalemRow }) => (
        <div className="!flex !items-center !justify-center !h-full !w-full">
          <Popconfirm
            title="Satırı sil"
            description="Bu satırı silmek istediğinize emin misiniz?"
            okText="Evet, sil"
            cancelText="Vazgeç"
            okButtonProps={{ danger: true, size: 'small' }}
            cancelButtonProps={{ size: 'small' }}
            placement="right"
            onConfirm={() => removeKalem(p.data.key)}
          >
            <Tooltip title="Satır Sil">
              <Button type="text" danger size="small" icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
    {
      headerName: 'Tip', field: 'tip', width: 110, cellClass: '!p-0',
      cellRenderer: (p: { data: KalemRow }) => (
        <Select
          size="small"
          value={p.data.tip}
          onChange={(val) => updateKalem(p.data.key, { tip: val })}
          variant="borderless"
          className="!w-full !h-full !text-[12px] kalem-select"
          popupMatchSelectWidth={false}
          options={[
            { value: 'Malzeme', label: 'Malzeme' },
            { value: 'Hizmet', label: 'Hizmet' },
            { value: 'Demirbaş', label: 'Demirbaş' },
          ]}
        />
      ),
    },
    {
      headerName: 'Malzeme Kodu', field: 'malzemeKod', width: 130, cellClass: '!p-0',
      cellRenderer: (p: { data: KalemRow; node: { rowIndex: number | null } }) => (
        <SearchableMalzemeSelect
          value={p.data.malzemeKod}
          widthClass="!w-full"
          className="!w-full !h-full !text-[12px] kalem-select"
          onChange={(kod, rec) => {
            const rawKdv = rec ? String((rec as Malzeme).kdvGenel ?? '').replace('%', '').replace(',', '.') : ''
            const kdv = parseFloat(rawKdv) || 0
            const hesapBirimi = (rec as Malzeme)?.hesapBirimi ?? p.data.hesapBirimi
            const barkod = (rec as Malzeme)?.barkod ?? ''
            const kdvDahil = (rec as Malzeme)?.kdvDahil ?? p.data.kdvDahil
            updateKalem(p.data.key, { malzemeKod: kod, malzemeAd: (rec as Malzeme)?.ad ?? '', barkod, kdv, hesapBirimi, kdvDahil })
            if (kod && p.node.rowIndex != null) focusNextCell('malzemeKod', p.node.rowIndex)
          }}
        />
      ),
    },
    { headerName: 'Malzeme Adı', field: 'malzemeAd', flex: 1, minWidth: 120 },
    {
      headerName: 'Varyant 1', field: 'varyant1RenkId', width: 130, cellClass: '!p-0',
      cellRenderer: (p: { data: KalemRow }) => (
        <SearchableRenkSelect
          value={p.data.varyant1RenkId}
          adGoster={false}
          widthClass="!w-full"
          className="!w-full !h-full"
          onChange={(id, rec) => updateKalem(p.data.key, {
            varyant1RenkId: id ?? null,
            varyant1RenkKod: rec?.kod ?? '',
            varyant1RenkAd: rec?.ad ?? '',
          })}
        />
      ),
    },
    {
      headerName: 'Varyant 1 Açıklama', field: 'varyant1RenkAd', width: 160,
      valueFormatter: (p) => p.value || '-',
    },
    ...(fasonFisTipleri.includes(irsaliyeTipi)
      ? [
          {
            // Boyahane Renk Kartı (Renk.tip=2). Seçici Kod sütununda; id arka planda tutulur,
            // ad ayrı sütunda gösterilir. Kayda sadece boyahaneRenkId gider.
            headerName: 'Boyahane Renk Kodu', field: 'boyahaneRenkId', width: 130, cellClass: '!p-0',
            cellRenderer: (p: { data: KalemRow }) => (
              <SearchableRenkSelect
                tip={2}
                value={p.data.boyahaneRenkId}
                adGoster={false}
                widthClass="!w-full"
                className="!w-full !h-full"
                onChange={(id, rec) => updateKalem(p.data.key, {
                  boyahaneRenkId: id ?? null,
                  boyahaneRenkKod: rec?.kod ?? '',
                  boyahaneRenkAd: rec?.ad ?? '',
                })}
              />
            ),
          } as ColDef<KalemRow>,
          {
            headerName: 'Boyahane Renk Adı', field: 'boyahaneRenkAd', width: 160,
            valueFormatter: (p) => p.value || '-',
          } as ColDef<KalemRow>,
          {
            headerName: 'İstenen Gram', field: 'istenenGram', width: 110, cellClass: '!p-0', type: 'rightAligned',
            cellRenderer: (p: { data: KalemRow; value: number; node: { rowIndex: number | null } }) => (
              <TurkishNumberInput
                value={p.value}
                onChange={(val) => updateKalem(p.data.key, { istenenGram: val })}
                onEnter={() => p.node.rowIndex != null && focusNextCell('istenenGram', p.node.rowIndex)}
                className="!w-full !h-full !text-[12px] kalem-input"
              />
            ),
          } as ColDef<KalemRow>,
          {
            headerName: 'Ebat', field: 'ebat', width: 110, cellClass: '!p-0',
            cellRenderer: (p: { data: KalemRow; value: string; node: { rowIndex: number | null } }) => (
              <CellTextInput
                value={p.value ?? ''}
                onCommit={(val) => updateKalem(p.data.key, { ebat: val })}
                onEnter={() => p.node.rowIndex != null && focusNextCell('ebat', p.node.rowIndex)}
                className="!w-full !h-full !text-[12px] kalem-input"
              />
            ),
          } as ColDef<KalemRow>,
          {
            headerName: 'Top Sayısı', field: 'topSayisi', width: 100, cellClass: '!p-0', type: 'rightAligned',
            cellRenderer: (p: { data: KalemRow; value: number; node: { rowIndex: number | null } }) => (
              <TurkishNumberInput
                value={p.value}
                onChange={(val) => updateKalem(p.data.key, { topSayisi: Math.round(val) })}
                onEnter={() => p.node.rowIndex != null && focusNextCell('topSayisi', p.node.rowIndex)}
                className="!w-full !h-full !text-[12px] kalem-input"
              />
            ),
          } as ColDef<KalemRow>,
          {
            // Satıra seçilen prosesler, sıra numarasına göre (sağ tık → Prosesler... ile düzenlenir).
            headerName: 'Prosesler', field: 'prosesler', width: 180,
            valueFormatter: (p) => prosesAdlariGetir(p.value as KalemProses[]) || '-',
          } as ColDef<KalemRow>,
        ]
      : []),
    // 11-Fasondan Giriş: kaleme "kalite kontrol gerekmez" işareti. İşaretli kalemler
    // Kalite Kontrol Girişleri'ndeki "Kalite Bekleyen" listesine girmez.
    ...(irsaliyeTipi === '11'
      ? [
          {
            headerName: 'Kalite Yapılmayacak', field: 'kaliteYapilmayacak', width: 160, cellClass: '!p-0',
            cellRenderer: (p: { data: KalemRow }) => (
              <Checkbox
                checked={!!p.data.kaliteYapilmayacak}
                onChange={(e) => updateKalem(p.data.key, { kaliteYapilmayacak: e.target.checked })}
              />
            ),
          } as ColDef<KalemRow>,
        ]
      : []),
    {
      headerName: 'Barkod', field: 'barkod', width: 120, resizable: true,
      valueFormatter: (p) => p.value || '-',
    },
    {
      headerName: 'Parti No', field: 'partiNo', width: 110, resizable: true, cellClass: '!p-0',
      cellRenderer: (p: { data: KalemRow; value: string; node: { rowIndex: number | null } }) => (
        <CellTextInput
          value={p.value ?? ''}
          onCommit={(val) => updateKalem(p.data.key, { partiNo: val })}
          onEnter={() => p.node.rowIndex != null && focusNextCell('partiNo', p.node.rowIndex)}
          className="!w-full !h-full !text-[12px] kalem-input"
        />
      ),
    },
    {
      headerName: 'Brüt Kg', field: 'brutKg', width: 90, cellClass: '!p-0', type: 'rightAligned',
      cellRenderer: (p: { data: KalemRow; value: number; node: { rowIndex: number | null } }) => (
        <TurkishNumberInput
          value={p.value}
          onChange={(val) => updateKalem(p.data.key, { brutKg: val })}
          onEnter={() => p.node.rowIndex != null && focusNextCell('brutKg', p.node.rowIndex)}
          className="!w-full !h-full !text-[12px] kalem-input"
        />
      ),
    },
    {
      headerName: 'Kg', field: 'kg', width: 90, cellClass: '!p-0', type: 'rightAligned',
      cellRenderer: (p: { data: KalemRow; value: number; node: { rowIndex: number | null } }) => (
        <TurkishNumberInput
          value={p.value}
          onChange={(val) => updateKalem(p.data.key, { kg: val })}
          onEnter={() => p.node.rowIndex != null && focusNextCell('kg', p.node.rowIndex)}
          className="!w-full !h-full !text-[12px] kalem-input"
        />
      ),
    },
    {
      headerName: 'Brüt Mt', field: 'brutMt', width: 90, cellClass: '!p-0', type: 'rightAligned',
      cellRenderer: (p: { data: KalemRow; value: number; node: { rowIndex: number | null } }) => (
        <TurkishNumberInput
          value={p.value}
          onChange={(val) => updateKalem(p.data.key, { brutMt: val })}
          onEnter={() => p.node.rowIndex != null && focusNextCell('brutMt', p.node.rowIndex)}
          className="!w-full !h-full !text-[12px] kalem-input"
        />
      ),
    },
    {
      headerName: 'Mt', field: 'mt', width: 90, cellClass: '!p-0', type: 'rightAligned',
      cellRenderer: (p: { data: KalemRow; value: number; node: { rowIndex: number | null } }) => (
        <TurkishNumberInput
          value={p.value}
          onChange={(val) => updateKalem(p.data.key, { mt: val })}
          onEnter={() => p.node.rowIndex != null && focusNextCell('mt', p.node.rowIndex)}
          className="!w-full !h-full !text-[12px] kalem-input"
        />
      ),
    },
    {
      headerName: 'Adet', field: 'adet', width: 90, cellClass: '!p-0', type: 'rightAligned',
      cellRenderer: (p: { data: KalemRow; value: number; node: { rowIndex: number | null } }) => (
        <TurkishNumberInput
          value={p.value}
          onChange={(val) => updateKalem(p.data.key, { adet: val })}
          onEnter={() => p.node.rowIndex != null && focusNextCell('adet', p.node.rowIndex)}
          className="!w-full !h-full !text-[12px] kalem-input"
        />
      ),
    },
    {
      headerName: 'Hesap Birimi', field: 'hesapBirimi', width: 110, cellClass: '!p-0',
      cellRenderer: (p: { data: KalemRow }) => (
        <Select
          size="small"
          value={p.data.hesapBirimi}
          onChange={(val) => updateKalem(p.data.key, { hesapBirimi: val })}
          variant="borderless"
          className="!w-full !h-full !text-[12px] kalem-select"
          popupMatchSelectWidth={false}
          options={[
            { value: 'brutKg', label: 'Brüt Kg' },
            { value: 'kg', label: 'Kg' },
            { value: 'brutMt', label: 'Brüt Mt' },
            { value: 'mt', label: 'Mt' },
            { value: 'adet', label: 'Adet' },
          ]}
        />
      ),
    },
    {
      headerName: 'Birim Fiyat', field: 'birimFiyat', width: 100, cellClass: '!p-0', type: 'rightAligned',
      cellRenderer: (p: { data: KalemRow; value: number; node: { rowIndex: number | null } }) => (
        <TurkishNumberInput
          value={p.value}
          onChange={(val) => updateKalem(p.data.key, { birimFiyat: val })}
          onEnter={() => p.node.rowIndex != null && focusNextCell('birimFiyat', p.node.rowIndex)}
          className="!w-full !h-full !text-[12px] kalem-input"
        />
      ),
    },
    {
      headerName: 'KDV D/H', field: 'kdvDahil', width: 90, cellClass: '!p-0',
      cellRenderer: (p: { data: KalemRow }) => (
        <Select
          size="small"
          value={p.data.kdvDahil ? 'dahil' : 'haric'}
          onChange={(val) => updateKalem(p.data.key, { kdvDahil: val === 'dahil' })}
          variant="borderless"
          className="!w-full !h-full !text-[12px] kalem-select"
          popupMatchSelectWidth={false}
          options={[
            { value: 'haric', label: 'Hariç' },
            { value: 'dahil', label: 'Dahil' },
          ]}
        />
      ),
    },
    {
      headerName: 'İskonto %', field: 'iskontoOrani', width: 90, cellClass: '!p-0', type: 'rightAligned',
      cellRenderer: (p: { data: KalemRow; value: number; node: { rowIndex: number | null } }) => (
        <TurkishNumberInput
          value={p.value}
          onChange={(val) => updateKalem(p.data.key, { iskontoOrani: val })}
          onEnter={() => p.node.rowIndex != null && focusNextCell('iskontoOrani', p.node.rowIndex)}
          className="!w-full !h-full !text-[12px] kalem-input"
        />
      ),
    },
    {
      headerName: 'İskonto', field: 'iskontoTutari', width: 100, cellClass: '!p-0', type: 'rightAligned',
      cellRenderer: (p: { data: KalemRow; value: number; node: { rowIndex: number | null } }) => (
        <TurkishNumberInput
          value={p.value}
          onChange={(val) => updateKalem(p.data.key, { iskontoTutari: val })}
          onEnter={() => p.node.rowIndex != null && focusNextCell('iskontoTutari', p.node.rowIndex)}
          className="!w-full !h-full !text-[12px] kalem-input"
        />
      ),
    },
    {
      headerName: 'KDV %', field: 'kdv', width: 80, cellClass: '!p-0', type: 'rightAligned',
      cellRenderer: (p: { data: KalemRow; value: number; node: { rowIndex: number | null } }) => (
        <TurkishNumberInput
          value={p.value}
          onChange={(val) => updateKalem(p.data.key, { kdv: val })}
          onEnter={() => p.node.rowIndex != null && focusNextCell('kdv', p.node.rowIndex)}
          className="!w-full !h-full !text-[12px] kalem-input"
        />
      ),
    },
    {
      headerName: 'Tutar', field: 'satirTutari', width: 120, resizable: true, type: 'rightAligned',
      valueFormatter: (p) => numberFormat(p.value as number),
    },
    {
      headerName: 'Açıklama', field: 'aciklama', width: 160, cellClass: '!p-0',
      cellRenderer: (p: { data: KalemRow; value: string; node: { rowIndex: number | null } }) => (
        <CellTextInput
          value={p.value ?? ''}
          onCommit={(val) => updateKalem(p.data.key, { aciklama: val })}
          onEnter={() => addKalemAndFocusMalzeme()}
          className="!w-full !h-full !text-[12px] kalem-input"
        />
      ),
    },
  ], [kalemler.length])

  const storageKey = 'irsaliyeKarti_' + irsaliyeTipi
  const kolonLayoutKey = useCallback(
    () => `kolon_layout_${kullanici?.id ?? 'anonim'}_${storageKey}`,
    [kullanici?.id, storageKey],
  )
  const [kolonChooserOpen, setKolonChooserOpen] = useState(false)
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return defaultHiddenColsFor(irsaliyeTipi)
    try {
      const raw = localStorage.getItem(kolonLayoutKey())
      if (!raw) return defaultHiddenColsFor(irsaliyeTipi)
      const kayitlar: KolonKaydi[] = JSON.parse(raw)
      return new Set(kayitlar.filter((k) => k.gizli).map((k) => k.kolonAdi))
    } catch { return defaultHiddenColsFor(irsaliyeTipi) }
  })

  const chooserCols = useMemo(
    () =>
      colDefs
        .map((c) => ({
          id: c.colId ?? c.field ?? '',
          label: c.headerName ?? '',
        }))
        .filter((c) => c.id && c.id !== 'key'),
    [],
  )

  const syncHiddenFromGrid = useCallback(() => {
    const api = gridApiRef.current
    if (!api) return
    const states = api.getColumnState()
    if (!states) return
    setHiddenCols(new Set(states.filter((s) => s.hide).map((s) => s.colId)))
  }, [])

  const applyKolonKayitlari = useCallback((api: GridApi<KalemRow>, kayitlar: KolonKaydi[]) => {
    if (!kayitlar.length) return
    kayitlar.forEach((k) => {
      if (k.gizli !== undefined) {
        api.setColumnsVisible([k.kolonAdi], !k.gizli)
      }
      if (k.genislik != null) {
        api.setColumnWidths([{ key: k.kolonAdi, newWidth: k.genislik }])
      }
    })
  }, [])

  const tryLoadKolonFromDb = useCallback((api: GridApi<KalemRow>) => {
    const lsKayitlar: KolonKaydi[] = JSON.parse(localStorage.getItem(kolonLayoutKey()) || '[]')
    if (lsKayitlar.length > 0) {
      applyKolonKayitlari(api, lsKayitlar)
      syncHiddenFromGrid()
      return
    }
    kolonSecimiApi.get(storageKey)
      .then((dbKayitlar) => {
        if (dbKayitlar.length > 0) {
          applyKolonKayitlari(api, dbKayitlar)
        } else {
          const defaults = defaultHiddenColsFor(irsaliyeTipi)
          if (defaults.size > 0) api.setColumnsVisible(Array.from(defaults), false)
          setHiddenCols(defaults)
        }
        syncHiddenFromGrid()
      })
      .catch(() => {
        const defaults = defaultHiddenColsFor(irsaliyeTipi)
        if (defaults.size > 0) api.setColumnsVisible(Array.from(defaults), false)
        setHiddenCols(defaults)
        syncHiddenFromGrid()
      })
  }, [applyKolonKayitlari, syncHiddenFromGrid, irsaliyeTipi, storageKey, kolonLayoutKey])

  const persistKolonlar = useCallback(() => {
    const api = gridApiRef.current
    if (!api) return
    const states = api.getColumnState()
    if (!states) return
    const kolonlar: KolonKaydi[] = states.map((s) => ({
      kolonAdi: s.colId,
      gizli: s.hide ?? false,
      genislik: s.width ?? null,
      sira: null,
      siralamaYon: s.sort ?? null,
    }))
    localStorage.setItem(kolonLayoutKey(), JSON.stringify(kolonlar))
    if (kullanici?.id) {
      kolonSecimiApi.save(storageKey, kolonlar).catch(() => {})
    }
  }, [kullanici?.id, kolonLayoutKey, storageKey])

  const toggleKolon = (id: string, visible: boolean) => {
    setHiddenCols((prev) => {
      const next = new Set(prev)
      if (visible) next.delete(id)
      else next.add(id)
      return next
    })
    gridApiRef.current?.setColumnsVisible([id], visible)
    persistKolonlar()
  }

  const saveKolonlar = useCallback(() => {
    persistKolonlar()
    setKolonChooserOpen(false)
  }, [persistKolonlar])

  const [fasonGidenlerOpen, setFasonGidenlerOpen] = useState(false)
  const [fasonGidenlerData, setFasonGidenlerData] = useState<Irsaliye[]>([])
  const [fasonGidenGirislerData, setFasonGidenGirislerData] = useState<Irsaliye[]>([])
  const [fasonGidenlerYukleniyor, setFasonGidenlerYukleniyor] = useState(false)
  const [fasonGidenArama, setFasonGidenArama] = useState('')
  const fasonGidenGridRef = useRef<GridApi>(null)

  // 134-Fasona Çıkış: açık 202 talimatlarını listeler, seçilen kalemleri içe aktarır.
  // Kalan hesap: 202 kalem brüt − (134 kalemlerinde kaynakKalemId ile toplanan aktarılan).
  const [acikTalimatlariOpen, setAcikTalimatlariOpen] = useState(false)
  const [acikTalimatlariData, setAcikTalimatlariData] = useState<Irsaliye[]>([])
  const [acikTalimatlariCikisData, setAcikTalimatlariCikisData] = useState<Irsaliye[]>([])
  const [acikTalimatlariYukleniyor, setAcikTalimatlariYukleniyor] = useState(false)
  const [acikTalimatlariArama, setAcikTalimatlariArama] = useState('')
  const acikTalimatGridRef = useRef<GridApi>(null)

  const openFasonGidenler = () => {
    setFasonGidenlerOpen(true)
    setFasonGidenlerYukleniyor(true)
    setFasonGidenArama('')
    irsaliyeApi
      .list()
      .then((res) => {
        setFasonGidenlerData(res.filter((i) => String(i.irsaliyeTipi) === '134'))
        setFasonGidenGirislerData(res.filter((i) => String(i.irsaliyeTipi) === '11'))
      })
      .catch(() => {
        setFasonGidenlerData([])
        setFasonGidenGirislerData([])
      })
      .finally(() => setFasonGidenlerYukleniyor(false))
  }

  const openAcikTalimatlari = () => {
    setAcikTalimatlariOpen(true)
    setAcikTalimatlariYukleniyor(true)
    setAcikTalimatlariArama('')
    irsaliyeApi
      .list()
      .then((res) => {
        // Açık talimatlar: tüm 202-Fason Talimatları. Kalan <= 0 olanlar listeden düşer
        // (tamamen 134'e çıkış yapılmışsa). tamamlandi filtresi YOK: kalan hesabı yeterli.
        setAcikTalimatlariData(res.filter((i) => String(i.irsaliyeTipi) === '202'))
        // Kalan hesap için 134 çıkışları: kaynakKalemId ile daha önce aktarılan miktar toplanır.
        setAcikTalimatlariCikisData(res.filter((i) => String(i.irsaliyeTipi) === '134'))
      })
      .catch(() => {
        setAcikTalimatlariData([])
        setAcikTalimatlariCikisData([])
      })
      .finally(() => setAcikTalimatlariYukleniyor(false))
  }

  const handleIrsaliyeOlustur = () => {
    // 201: onaysız (Taslak) siparişten irsaliye oluşturulamaz.
    if (irsaliyeTipi === '201' && !onaylandi) {
      message.warning('Onaysız sipariş üzerinden irsaliye oluşturamazsınız. Önce Durumu Kesinleşti yapıp kaydedin.')
      return
    }
    // Belge bazında aktarım: seçimden bağımsız TÜM geçerli satırlar aktarılır.
    // (Satıra tıklanması seçim oluşturuyordu ve 134'e tek satır gidiyordu.)
    const kaynak = kalemler.filter((k) => Boolean(k.malzemeKod))
    if (kaynak.length === 0) {
      message.warning('Aktarılacak kalem yok')
      return
    }
    const kalemlerOut: IrsaliyeBaslangicKalem[] = []
    for (const k of kaynak) {
      let birim = k.hesapBirimi
      if (birim === 'brutKg') birim = 'kg'
      else if (birim === 'brutMt') birim = 'mt'
      const miktar = hesapMiktariGetir(k)
      if (!miktar) {
        message.error(`${k.malzemeKod} ${k.malzemeAd} için miktar girilmemiş`)
        return
      }
      // 202-Fason Talimatı -> 134-Fasona Çıkış: varyant (sipariş rengi) DÜŞÜRÜLÜR.
      // Çıkış ham kumaştır; boyahane kartı dönüşte (11-Fasondan Giriş) seçilir.
      kalemlerOut.push({
        malzemeKod: k.malzemeKod,
        malzemeAd: k.malzemeAd,
        miktar,
        birim,
        birimFiyat: k.birimFiyat || undefined,
        cariHesapKod: cariKod || undefined,
        depoKod: depoKod || undefined,
        aciklama: k.aciklama || '',
        partiNo: k.partiNo || null,
        siparisKalemId: k.siparisKalemId ?? null,
        // Kaynak kalem: bu satırın kendi id'si (kayıtlı fişten aktarımda). Yeni satırsa üstten gelen kaynak korunur.
        kaynakKalemId: k.kalemId ?? k.kaynakKalemId ?? null,
        // Kumaş bilgileri talimattan çıkışa aynen taşınır.
        istenenGram: k.istenenGram || undefined,
        ebat: k.ebat || undefined,
        topSayisi: k.topSayisi || undefined,
        // Boyahane rengi boya siparişinin kendisi -> 202'den 134'e taşınır (kod/ad dahil, ekranda görünsün).
        boyahaneRenkId: k.boyahaneRenkId ?? null,
        boyahaneRenkKod: k.boyahaneRenkKod || undefined,
        boyahaneRenkAd: k.boyahaneRenkAd || undefined,
        // varyant1 (sipariş rengi) 202'den 134'e taşınmaz: çıkış ham kumaştır.
        varyant1RenkId: irsaliyeTipi === '202' ? null : (k.varyant1RenkId ?? null),
        // Birleşmiş satırın tahsis dağılımı sonraki fişe de taşınır (salt-okunur detay).
        tahsis: k.tahsis ?? [],
        // Satıra seçilen prosesler sonraki fişe de taşınır (134'te düzenlenebilir).
        prosesler: (k.prosesler ?? []).map((p) => ({ ...p })),
      })
    }
    // 201 -> Satın Alma İrsaliyesi (tip 1); 202 -> Fasona Çıkış (tip 134, fason tipi aynen taşınır)
    // Kayıtlı 202'den açılıyorsa talimat id'si de taşınır (kaydederken 134'e yazılır).
    onCreateIrsaliye?.(irsaliyeTipi === '202' ? '134' : '1', kalemlerOut, irsaliyeTipi === '202' ? fasonTipiKayit : null, irsaliyeTipi === '202' ? (id ?? null) : null)
  }

  const contextMenuItems: MenuProps['items'] =
    irsaliyeTipi === '11'
      ? [
          { key: 'barkod-detay', label: 'Barkod Detayları', onClick: openBarkodDetay },
          { key: 'fason-gidenler', label: 'Fason Gidenler', onClick: () => openFasonGidenler() },
          ...(id ? [{ key: 'fatura-olustur', label: 'Fatura Oluştur', onClick: () => onCreateFatura?.({ faturaTipi: irsaliyeTipi, irsaliyeIds: [id], fasonTipiId: fasonTipiKayit }) }] : []),
        ]
      : irsaliyeTipi === '201'
        ? [
            { key: 'irsaliye-olustur', label: 'İrsaliye Oluştur', onClick: handleIrsaliyeOlustur },
            { key: 'tahsis-detay', label: 'Tahsis Detayları', onClick: openTahsisDetay },
          ]
        : irsaliyeTipi === '202'
          ? [
              { key: 'irsaliye-olustur', label: 'Fasona Çıkış (134) Oluştur', onClick: handleIrsaliyeOlustur },
              { key: 'tahsis-detay', label: 'Tahsis Detayları', onClick: openTahsisDetay },
              { key: 'prosesler', label: 'Prosesler...', onClick: openProsesler },
            ]
          : irsaliyeTipi === '134'
            ? [
                { key: 'acik-talimatlar', label: 'Açık Talimatlar (202)...', onClick: openAcikTalimatlari },
                ...(id ? [{ key: 'fatura-olustur', label: 'Fatura Oluştur', onClick: () => onCreateFatura?.({ faturaTipi: irsaliyeTipi, irsaliyeIds: [id], fasonTipiId: fasonTipiKayit }) }] : []),
                { key: 'tahsis-detay', label: 'Tahsis Detayları', onClick: openTahsisDetay },
                { key: 'prosesler', label: 'Prosesler...', onClick: openProsesler },
              ]
            : id
              ? [{ key: 'fatura-olustur', label: 'Fatura Oluştur', onClick: () => onCreateFatura?.({ faturaTipi: irsaliyeTipi, irsaliyeIds: [id], fasonTipiId: fasonTipiKayit }) }]
              : []

  const iceriAktar = () => {
    const secili = fasonGidenGridRef.current?.getSelectedRows() ?? []
    if (secili.length === 0) {
      message.warning('İçe aktarılacak kalem seçiniz')
      return
    }
    const yeniKalemler: KalemRow[] = secili.map((k: FasonGidenSatir) => ({
      key: Math.random().toString(36).slice(2),
      uuid: null,
      kaliteYapilmayacak: false,
      tip: k.tip ?? 'Malzeme',
      malzemeKod: k.malzeme?.kod ?? (k.malzemeId != null ? String(k.malzemeId) : ''),
      malzemeAd: k.malzeme?.ad ?? '',
      // Barkod GERÇEK barkodu taşır (malzemenin barkodu, yoksa 134'ün takip no'su).
      // Kaynak 134 kalemi FK'si (kaynakKalemId) ile izlenir — barkod alanına teknik
      // olarak kalem id yazılmaz.
      barkod: k.malzeme?.barkod ?? k.takipNo ?? '',
      // Fason girişinde brüt TAŞINIR ve KALAN miktar kadar taşınır (ne kadar gitti),
      // net ve fire BOŞ kalır: operatör gerçekte dönen brüt/net miktarını girer.
      // (Kalan = 134.brüt − Σ11.brüt; 134'ün brüt'ünün tamamı değil, kalan kadar.)
      brutKg:
        k.olcuBirimi === 'brutKg' || k.olcuBirimi === 'kg' ? Number(k.kalan) || 0 : 0,
      kg: 0,
      brutMt:
        k.olcuBirimi === 'brutMt' || k.olcuBirimi === 'mt' ? Number(k.kalan) || 0 : 0,
      mt: 0,
      adet: k.olcuBirimi === 'adet' ? Number(k.kalan) || 0 : 0,
      hesapBirimi: k.olcuBirimi || 'kg',
      birimFiyat: Number(k.birimFiyat) || 0,
      doviz: k.doviz || 'TL',
      kdv: Number(k.kdv) || 0,
      kdvDahil: k.kdvDahil ?? false,
      iskontoOrani: Number(k.iskontoOrani) || 0,
      iskontoTutari: Number(k.iskontoTutari) || 0,
      satirTutari: Number(k.satirTutari) || 0,
      aciklama: k.aciklama ?? '',
      partiNo: k.partiNo ?? '',
      siparisKalemId: k.siparisKalemId ?? null,
      // 11 giriş kaleminin kaynağı 134'ün kalemidir (zincir: 202 → 134 → 11).
      kalemId: null,
      kaynakKalemId: k.id ?? null,
      // Kumaş bilgileri 134'ten 11'e aynen taşınır.
      istenenGram: Number(k.istenenGram) || 0,
      ebat: k.ebat ?? '',
      topSayisi: Number(k.topSayisi) || 0,
      // Boyahane rengi 134'den gelir (boya siparişi verilirken seçilmişti), aynen taşınır.
      boyahaneRenkId: k.boyahaneRenkId ?? k.boyahaneRenk?.id ?? null,
      boyahaneRenkKod: k.boyahaneRenk?.kod ?? '',
      boyahaneRenkAd: k.boyahaneRenk?.ad ?? '',
      varyant1RenkId: k.varyant1RenkId ?? k.varyant1Renk?.id ?? null,
      varyant1RenkKod: k.varyant1Renk?.kod ?? '',
      varyant1RenkAd: k.varyant1Renk?.ad ?? '',
      fire: null,
      // 134'teki birleşmiş satırın tahsis dağılımı 11 girişine de taşınır.
      tahsis: (k.tahsisler ?? []).map((t) => ({
        siparisKalemId: t.siparisKalemId ?? null,
        siparisNo: t.siparisNo ?? '',
        modelKod: t.modelKod ?? '',
        miktar: Number(t.miktar) || 0,
      })),
      // 134'teki proses seçimleri 11 girişine de taşınır (sıralarıyla).
      prosesler: (k.islemler ?? [])
        .map((x, i) => ({ islemId: x.islem?.id ?? x.islemId ?? 0, ad: x.islem?.ad ?? '', sira: (x as { sira?: number }).sira ?? i + 1 }))
        .filter((x) => x.islemId > 0 && x.ad),
    }))
    setKalemler((prev) => {
      const bosMu = prev.every((p) => !p.malzemeKod)
      return bosMu ? yeniKalemler : [...prev, ...yeniKalemler]
    })
    message.success(`${yeniKalemler.length} kalem içe aktarıldı`)
    setFasonGidenlerOpen(false)
  }

  // 134-Fasona Çıkış: seçilen açık 202 talimatı kalemlerini bu 134'e aktarır.
  // 202 → 134: varyant1 (sipariş rengi) düşer, aktarım KALAN miktar kadar yapılır.
  const acikTalimatlariIceriAktar = () => {
    const secili = acikTalimatGridRef.current?.getSelectedRows() ?? []
    if (secili.length === 0) {
      message.warning('İçe aktarılacak kalem seçiniz')
      return
    }
    const yeniKalemler: KalemRow[] = secili.map((k: IrsaliyeKalem & { kalan: number }) => {
      // Aktarım miktarı kalandır (brüt yerine). Ölçü birimine göre ilgili brüt alanına yazılır.
      const kalan = Number(k.kalan) || 0
      const brutKg = k.olcuBirimi === 'brutKg' || k.olcuBirimi === 'kg' ? kalan : 0
      const brutMt = k.olcuBirimi === 'brutMt' || k.olcuBirimi === 'mt' ? kalan : 0
      const adet = k.olcuBirimi === 'adet' ? kalan : 0
      return {
        key: Math.random().toString(36).slice(2),
        uuid: null,
        kaliteYapilmayacak: false,
        tip: k.tip ?? 'Malzeme',
        malzemeKod: k.malzeme?.kod ?? (k.malzemeId != null ? String(k.malzemeId) : ''),
        malzemeAd: k.malzeme?.ad ?? '',
        barkod: k.id != null ? String(k.id) : '',
        brutKg,
        kg: 0,
        brutMt,
        mt: 0,
        adet,
        hesapBirimi: k.olcuBirimi || 'mt',
        birimFiyat: Number(k.birimFiyat) || 0,
        doviz: k.doviz || 'TL',
        kdv: Number(k.kdv) || 0,
        kdvDahil: k.kdvDahil ?? false,
        iskontoOrani: Number(k.iskontoOrani) || 0,
        iskontoTutari: Number(k.iskontoTutari) || 0,
        satirTutari: Number(k.satirTutari) || 0,
        aciklama: k.aciklama ?? '',
        partiNo: k.partiNo ?? '',
        siparisKalemId: k.siparisKalemId ?? null,
        kalemId: null,
        // 134'ün kaynağı 202'nin kalemidir (zincir: 202 → 134 → 11).
        kaynakKalemId: k.id ?? null,
        istenenGram: Number(k.istenenGram) || 0,
        ebat: k.ebat ?? '',
        topSayisi: Number(k.topSayisi) || 0,
        boyahaneRenkId: k.boyahaneRenkId ?? k.boyahaneRenk?.id ?? null,
        boyahaneRenkKod: k.boyahaneRenk?.kod ?? '',
        boyahaneRenkAd: k.boyahaneRenk?.ad ?? '',
        // 202 → 134: varyant1 (sipariş rengi) DÜŞER — çıkış ham kumaştır.
        varyant1RenkId: null,
        varyant1RenkKod: '',
        varyant1RenkAd: '',
        fire: null,
        tahsis: (k.tahsisler ?? []).map((t) => ({
          siparisKalemId: t.siparisKalemId ?? null,
          siparisNo: t.siparisNo ?? '',
          modelKod: t.modelKod ?? '',
          miktar: Number(t.miktar) || 0,
        })),
        prosesler: (k.islemler ?? [])
          .map((x, i) => ({ islemId: x.islem?.id ?? x.islemId ?? 0, ad: x.islem?.ad ?? '', sira: (x as { sira?: number }).sira ?? i + 1 }))
          .filter((x) => x.islemId > 0 && x.ad),
      }
    })
    setKalemler((prev) => {
      const bosMu = prev.every((p) => !p.malzemeKod)
      return bosMu ? yeniKalemler : [...prev, ...yeniKalemler]
    })
    message.success(`${yeniKalemler.length} kalem içe aktarıldı`)
    setAcikTalimatlariOpen(false)
  }

  // "Fason Gidenler" listesi: 11'te seçilen cariye (fasoncu/boyahane) stok çıkışı
  // yapılmış 134'ler. Cari seçilmemişse tüm 134'ler listelenir (modal'da uyarı çıkar).
  const fasonGidenlerFiltreli = useMemo(
    () => (cariKod ? fasonGidenlerData.filter((d) => d.cariHesap?.kod === cariKod) : fasonGidenlerData),
    [fasonGidenlerData, cariKod],
  )

  const fasonGidenSatirlar = useMemo(() => {
    // 134 kalem id → o kalemden gelen 11'lerin BRÜT miktarı toplamı.
    // Eşleştirme kaynağı: 11 kaleminin kaynakKalemId'si (134 kalem FK'si).
    // Eski kod takipNo (serbest metin) ile eşleştiriyordu → hiçbir miktar düşülmüyordu.
    const gorulenMiktar = new Map<string, number>()

    // Ölçü birimine göre kalemdeki miktar (brüt doluysa brüt, boşsa net) — ortak yardımcı.
    // NOT: Fason akışında operatör miktarı çoğu zaman NET alanına yazıyor (brüt boş
    // kalıyor) — mevcut kayıtlar böyle. Sabit "brüt" okumak miktarı 0 yapıp satırları gizliyordu.

    // 134 kalem id'leri — takipNo fallback'ının güvenli kullanımı için (barkod artık
    // gerçek barkodu taşıyor; eski kayıtlarda takipNo = 134 kalem id idi).
    const kaynakKalemIds = new Set<string>()
    for (const i of fasonGidenlerData) {
      for (const k of i.kalemler ?? []) {
        if (k.id != null) kaynakKalemIds.add(String(k.id))
      }
    }
    const kaynakIdBul = (kalem: IrsaliyeKalem): number | null => {
      if (kalem.kaynakKalemId != null) return kalem.kaynakKalemId
      if (kalem.takipNo && kaynakKalemIds.has(kalem.takipNo)) return Number(kalem.takipNo)
      return null
    }

    // Kaydedilmiş diğer 11 (Fasondan Giriş) fişleri — birden fazla geliş birikir.
    // Eşleştirme: kaynakKalemId (FK) varsa o, yoksa takipNo (eski kayıtlarda 134 kalem id'si).
    for (const giris of fasonGidenGirislerData) {
      for (const k of giris.kalemler ?? []) {
        const kaynakId = kaynakIdBul(k)
        if (kaynakId == null || !Number.isFinite(kaynakId)) continue
        const m = kalemMiktari(
          k.olcuBirimi,
          Number(k.brutAgirlik) || 0,
          Number(k.netAgirlik) || 0,
          Number(k.brutMetre) || 0,
          Number(k.netMetre) || 0,
          Number(k.adet) || 0,
        )
        const key = String(kaynakId)
        gorulenMiktar.set(key, (gorulenMiktar.get(key) ?? 0) + m)
      }
    }

    // Bu fişteki (kaydedilmemiş) 11 kalemleri — kaynak 134 kalemi kaynakKalemId ile
    // taşınır (eski kayıtlarda barkod alanında 134 kalem id'si idi).
    for (const k of kalemler) {
      let kaynakId = k.kaynakKalemId ?? null
      if (kaynakId == null && k.barkod && kaynakKalemIds.has(k.barkod)) kaynakId = Number(k.barkod)
      if (kaynakId == null || !Number.isFinite(kaynakId)) continue
      const m = kalemMiktari(
        k.hesapBirimi,
        k.brutKg || 0,
        k.kg || 0,
        k.brutMt || 0,
        k.mt || 0,
        k.adet || 0,
      )
      const key = String(kaynakId)
      gorulenMiktar.set(key, (gorulenMiktar.get(key) ?? 0) + m)
    }

    const kaynakMiktar = (k: IrsaliyeKalem): number =>
      kalemMiktari(
        k.olcuBirimi,
        Number(k.brutAgirlik) || 0,
        Number(k.netAgirlik) || 0,
        Number(k.brutMetre) || 0,
        Number(k.netMetre) || 0,
        Number(k.adet) || 0,
      )

    const rows: FasonGidenSatir[] = []
    const arama = fasonGidenArama.trim().toLocaleLowerCase('tr-TR')
    for (const i of fasonGidenlerFiltreli) {
      // Fiş düzeyi eşleşme: fiş no, belge no, cari, fason alt tipi
      const fisMetni = `${i.irsaliyeNo} ${i.sevkNo ?? ''} ${i.cariHesap?.ad ?? ''} ${i.cariHesap?.kod ?? ''} ${i.fasonTipi?.ad ?? ''}`
      const fisEslesme = !arama || fisMetni.toLocaleLowerCase('tr-TR').includes(arama)
      for (const k of i.kalemler ?? []) {
        // Kalem düzeyi eşleşme: malzeme, varyant, boyahane rengi, takip no, açıklama
        const kalemMetni = `${k.malzeme?.kod ?? ''} ${k.malzeme?.ad ?? ''} ${k.varyant1Renk?.kod ?? ''} ${k.varyant1Renk?.ad ?? ''} ${k.boyahaneRenk?.kod ?? ''} ${k.boyahaneRenk?.ad ?? ''} ${k.takipNo ?? ''} ${k.aciklama ?? ''}`
        const kalemEslesme = !arama || kalemMetni.toLocaleLowerCase('tr-TR').includes(arama)
        if (!fisEslesme && !kalemEslesme) continue
        const idStr = k.id != null ? String(k.id) : null
        const kalan = kaynakMiktar(k) - (idStr ? (gorulenMiktar.get(idStr) ?? 0) : 0)
        if (idStr && kalan <= 0) continue
        rows.push({
          ...(k as IrsaliyeKalem),
          fisNo: i.irsaliyeNo,
          belgeNo: i.sevkNo ?? '',
          tarih: i.irsaliyeTarihi,
          cariAd: i.cariHesap?.ad ?? '',
          fasonTipiAd: i.fasonTipi?.ad ?? '',
          kalan,
        })
      }
    }
    return rows
  }, [fasonGidenlerData, fasonGidenlerFiltreli, fasonGidenGirislerData, kalemler, fasonGidenArama])

  // Açık 202 talimatlarının kalemleri (134 formunda içe aktarma listesi).
  const acikTalimatlariFiltreli = acikTalimatlariData.filter(
    (d) =>
      !acikTalimatlariArama ||
      `${d.irsaliyeNo} ${d.cariHesap?.ad ?? ''} ${d.cariHesap?.kod ?? ''} ${d.sevkNo ?? ''}`
        .toLocaleLowerCase('tr-TR')
        .includes(acikTalimatlariArama.toLocaleLowerCase('tr-TR')),
  )

  const acikTalimatlariSatirlar = useMemo(() => {
    const brutMiktar = (k: IrsaliyeKalem): number => {
      const b = String(k.olcuBirimi ?? '').toLowerCase().replace(/[\s_-]/g, '')
      if (b === 'brutkg' || b === 'kg') return Number(k.brutAgirlik) || Number(k.netAgirlik) || 0
      if (b === 'brutmt' || b === 'mt') return Number(k.brutMetre) || Number(k.netMetre) || 0
      if (b === 'adet') return Number(k.adet) || 0
      return 0
    }

    // 134 çıkış kalemlerinden daha önce aktarılan miktarı topla (kaynakKalemId → 202 kalem id).
    const aktarilan = new Map<string, number>()
    for (const cikis of acikTalimatlariCikisData) {
      for (const k of cikis.kalemler ?? []) {
        if (k.kaynakKalemId == null) continue
        const key = String(k.kaynakKalemId)
        aktarilan.set(key, (aktarilan.get(key) ?? 0) + brutMiktar(k))
      }
    }
    // Grid'e girilmemiş ama henüz kaydedilmemiş 134 kalemlerini de say (mevcut form).
    for (const k of kalemler) {
      if (k.kaynakKalemId == null) continue
      const m = k.hesapBirimi === 'brutKg' || k.hesapBirimi === 'kg' ? k.brutKg
        : k.hesapBirimi === 'brutMt' || k.hesapBirimi === 'mt' ? k.brutMt
        : k.adet
      const key = String(k.kaynakKalemId)
      aktarilan.set(key, (aktarilan.get(key) ?? 0) + (Number(m) || 0))
    }

    const rows: (IrsaliyeKalem & {
      talimatNo: string
      tarih: string | null
      cariAd: string
      fasonTipiAd: string
      kalan: number
    })[] = []
    for (const talimat of acikTalimatlariFiltreli) {
      for (const k of talimat.kalemler ?? []) {
        const idStr = k.id != null ? String(k.id) : null
        const kalan = brutMiktar(k) - (idStr ? (aktarilan.get(idStr) ?? 0) : 0)
        if (idStr && kalan <= 0) continue
        rows.push({
          ...(k as IrsaliyeKalem),
          talimatNo: talimat.irsaliyeNo,
          tarih: talimat.irsaliyeTarihi,
          cariAd: talimat.cariHesap?.ad ?? '',
          fasonTipiAd: talimat.fasonTipi?.ad ?? '',
          kalan,
        })
      }
    }
    return rows
  }, [acikTalimatlariFiltreli, acikTalimatlariCikisData, kalemler])

  const acikTalimatlariKolonlar = useMemo<ColDef<any>[]>(
    () => [
      { headerName: 'Talimat No', field: 'talimatNo', width: 110, cellClass: '!text-[#f57c00] !font-medium' },
      { headerName: 'Tarih', field: 'tarih', width: 100, valueFormatter: (p) => formatTarih(p.value) },
      { headerName: 'Cari Hesap', field: 'cariAd', flex: 1, minWidth: 140, valueFormatter: (p) => p.value || '-' },
      { headerName: 'Fason Alt Tipi', field: 'fasonTipiAd', width: 140, valueFormatter: (p) => p.value || '-' },
      { headerName: 'Malzeme Kodu', field: 'malzeme.kod', width: 110, valueFormatter: (p) => p.value || '-' },
      { headerName: 'Malzeme Adı', field: 'malzeme.ad', flex: 1, minWidth: 140, valueFormatter: (p) => p.value || '-' },
      { headerName: 'Brüt Kg', field: 'brutAgirlik', width: 90, type: 'rightAligned', valueFormatter: (p) => formatTR(Number(p.value) || 0) },
      { headerName: 'Brüt Mt', field: 'brutMetre', width: 90, type: 'rightAligned', valueFormatter: (p) => formatTR(Number(p.value) || 0) },
      { headerName: 'Adet', field: 'adet', width: 90, type: 'rightAligned', valueFormatter: (p) => formatTR(Number(p.value) || 0) },
      { headerName: 'Birim', field: 'olcuBirimi', width: 80, valueFormatter: (p) => p.value || '-' },
      { headerName: 'Kalan', field: 'kalan', width: 90, type: 'rightAligned', cellClass: '!font-semibold !text-[#f57c00]', valueFormatter: (p) => formatTR(Number(p.value) || 0) },
      { headerName: 'Boyahane Renk', field: 'boyahaneRenk.kod', width: 120, valueFormatter: (p) => p.value || '-' },
    ],
    [],
  )

  const fasonGidenSatirKolonlar = useMemo<ColDef<FasonGidenSatir>[]>(
    () => [
      { headerName: 'Çıkış Fiş No', field: 'fisNo', width: 110, cellClass: '!text-[#f57c00] !font-medium' },
      { headerName: 'Belge No', field: 'belgeNo', width: 100, valueFormatter: (p) => p.value || '-' },
      { headerName: 'Tarih', field: 'tarih', width: 100, valueFormatter: (p) => formatTarih(p.value) },
      { headerName: 'Cari Hesap', field: 'cariAd', flex: 1, minWidth: 120, valueFormatter: (p) => p.value || '-' },
      { headerName: 'Fason Alt Tipi', field: 'fasonTipiAd', width: 140, valueFormatter: (p) => p.value || '-' },
      { headerName: 'Tip', field: 'tip', width: 80, valueFormatter: (p) => p.value || '-' },
      { headerName: 'Malzeme Kodu', field: 'malzeme.kod', width: 110, valueFormatter: (p) => p.value || '-' },
      { headerName: 'Malzeme Adı', field: 'malzeme.ad', flex: 1, minWidth: 140, valueFormatter: (p) => p.value || '-' },
      { headerName: 'Varyant 1', field: 'varyant1Renk.kod', width: 100, valueFormatter: (p) => p.value || '-' },
      { headerName: 'Boyahane Renk Kodu', field: 'boyahaneRenk.kod', width: 130, valueFormatter: (p) => p.value || '-' },
      { headerName: 'Boyahane Renk Adı', field: 'boyahaneRenk.ad', width: 150, valueFormatter: (p) => p.value || '-' },
      { headerName: 'Takip No', field: 'takipNo', width: 110, valueFormatter: (p) => p.value || '-' },
      { headerName: 'Brüt Kg', field: 'brutAgirlik', width: 90, type: 'rightAligned', valueFormatter: (p) => formatTR(Number(p.value) || 0) },
      { headerName: 'Kg', field: 'netAgirlik', width: 90, type: 'rightAligned', valueFormatter: (p) => formatTR(Number(p.value) || 0) },
      { headerName: 'Brüt Mt', field: 'brutMetre', width: 90, type: 'rightAligned', valueFormatter: (p) => formatTR(Number(p.value) || 0) },
      { headerName: 'Mt', field: 'netMetre', width: 90, type: 'rightAligned', valueFormatter: (p) => formatTR(Number(p.value) || 0) },
      { headerName: 'Adet', field: 'adet', width: 90, type: 'rightAligned', valueFormatter: (p) => formatTR(Number(p.value) || 0) },
      { headerName: 'Birim', field: 'olcuBirimi', width: 80, valueFormatter: (p) => p.value || '-' },
      { headerName: 'Kalan', field: 'kalan', width: 90, type: 'rightAligned', valueFormatter: (p) => formatTR(Number(p.value) || 0) },
      { headerName: 'Açıklama', field: 'aciklama', width: 160, valueFormatter: (p) => p.value || '-' },
    ],
    [],
  )

  const kolonChooserContent = (
    <div className="!flex !flex-col !gap-1 !max-h-80 !overflow-auto !min-w-40">
      {chooserCols.map((c) => (
        <Checkbox
          key={c.id}
          checked={!hiddenCols.has(c.id)}
          onChange={(e) => toggleKolon(c.id, e.target.checked)}
          className="!text-[12px]"
        >
          {c.label}
        </Checkbox>
      ))}
      <Button
        type="primary"
        size="small"
        className="!mt-2 !text-[12px]"
        onClick={saveKolonlar}
      >
        Kaydet
      </Button>
    </div>
  )

  const toplam = kalemler.reduce((acc, k) => acc + (k.satirTutari || 0), 0)
  const toplamMatrah = kalemler.reduce((acc, k) => acc + satirHesapla(k).matrah, 0)
  const toplamKdv = toplam - toplamMatrah
  const kalemSayisi = kalemler.length

  return (
    <Spin spinning={loading} className="!h-full">
      <div className="!px-3 !flex !flex-col !h-full !overflow-hidden">
        <div style={{ marginLeft: -12, marginRight: -12 }}>
          <CardToolbar
            buttons={createToolbarButtons({
              onSave: handleKaydet,
              onDelete: handleSil,
              onReport: () => setRaporModalAcik(true),
            }, {
              delete: { onClick: handleSil, label: 'Sil', disabled: !id, danger: true },
              report: { disabled: !id },
            })}
          />
        </div>
        <div className="!flex-1 !min-h-0 !flex !flex-col">
          <div className="!flex-shrink-0 !space-y-1.5">
            <div className="!flex !gap-2">
              <div className="!shrink-0 !border !border-gray-200 !rounded-sm !p-2">
                <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-1">Genel Bilgiler</div>
                <div className="!space-y-0.5">
                  <div className="!flex !items-center !gap-3">
                    <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">Fiş No</div>
                    <Input size="small" value={irsaliyeNo} className="!w-48 !text-[12px]" readOnly />
                  </div>
                  <div className="!flex !items-center !gap-3">
                    <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">Fiş Tarihi</div>
                    <DatePicker size="small" value={irsaliyeTarihi} onChange={(d) => d && setIrsaliyeTarihi(d)} format="DD.MM.YYYY" placeholder="Fiş tarihi" className="!w-48 !text-[12px]" />
                  </div>
                  <div className="!flex !items-center !gap-3">
                    <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">{irsaliyeTipi === '201' || irsaliyeTipi === '202' ? 'Termin Tarihi' : 'Sevk Tarihi'}</div>
                    {irsaliyeTipi === '201' || irsaliyeTipi === '202' ? (
                      <DatePicker size="small" value={terminTarihi} onChange={(d) => setTerminTarihi(d)} format="DD.MM.YYYY" placeholder="Termin tarihi" className="!w-48 !text-[12px]" />
                    ) : (
                      <DatePicker size="small" value={sevkTarihi} onChange={(d) => setSevkTarihi(d)} format="DD.MM.YYYY" placeholder="Sevk tarihi" className="!w-48 !text-[12px]" />
                    )}
                  </div>
                  {irsaliyeTipi !== '201' && (
                    <div className="!flex !items-center !gap-3">
                      <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">Belge No</div>
                      <Input size="small" value={belgeNo} onChange={(e) => setBelgeNo(e.target.value)} className="!w-48 !text-[12px]" />
                    </div>
                  )}
                  <div className="!flex !items-center !gap-3">
                    <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">Açıklama</div>
                    <Input size="small" value={aciklama} onChange={(e) => setAciklama(e.target.value)} className="!w-48 !text-[12px]" />
                  </div>
                </div>
              </div>

              <div className="!flex-1 !border !border-gray-200 !rounded-sm !p-2">
                <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-1">Cari Hesap Bilgileri</div>
                <div className="!space-y-0.5">
                  <div className="!flex !items-center !gap-3">
                    <div className="!text-[12px] !text-[red] !w-24 !shrink-0">Cari Hesap</div>
                    <SearchableCariSelect value={cariKod} onChange={(kod) => setCariKod(kod)} />
                  </div>
                  <div className="!flex !items-center !gap-3">
                    <div className="!text-[12px] !text-[red] !w-24 !shrink-0">Depo</div>
                    <SearchableDepoSelect value={depoKod} onChange={(kod) => setDepoKod(kod)} />
                  </div>
                  <div className="!flex !items-center !gap-3">
                    <div className="!text-[12px] !text-[#333] !w-24 !shrink-0">Yetkili</div>
                    <Input size="small" value={yetkili} onChange={(e) => setYetkili(e.target.value)} className="!w-48 !text-[11px]" />
                  </div>
                  <div className="!mt-1 !border-t !border-gray-200 !pt-1">
                    <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-1">Diğer Bilgiler</div>
                    <div className="!space-y-0.5">
                      {(irsaliyeTipi === '201' || irsaliyeTipi === '202') && (
                        <div className="!flex !items-center !gap-3">
                          <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">Durum</div>
                          <Select
                            size="small"
                            className="!w-48 !text-[12px]"
                            value={tamamlandi ? 'tamamlandi' : onaylandi ? 'kesinlesti' : 'taslak'}
                            onChange={(val) => {
                              setTamamlandi(val === 'tamamlandi')
                              setOnaylandi(val === 'kesinlesti' || val === 'tamamlandi')
                            }}
                            options={[
                              { value: 'taslak', label: 'Taslak' },
                              { value: 'kesinlesti', label: 'Kesinleşti' },
                              { value: 'tamamlandi', label: 'Teslim Alındı' },
                            ]}
                          />
                        </div>
                      )}
                      {fasonTipiAd || fasonTipiKayit ? (
                        <div className="!flex !items-center !gap-3">
                          <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">Fason Tipi</div>
                          <Input
                            size="small"
                            value={fasonTipiAd || fasonTipleri.find((f) => f.id === fasonTipiKayit)?.ad || ''}
                            readOnly
                            className="!w-48 !text-[12px]"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {(bagliFaturaNo || talimatNo) && (
              <div className="!shrink-0 !border !border-gray-200 !rounded-sm !p-2">
                <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-1">Entegrasyon Bilgileri</div>
                <div className="!space-y-0.5">
                  {talimatNo && (
                    <div className="!flex !items-center !gap-3">
                      <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">Talimat</div>
                      <Tooltip title="Talimatı aç">
                        <Tag color="blue" onClick={handleTalimatAc} className="!cursor-pointer !text-[12px] !mr-0">
                          {talimatNo}
                        </Tag>
                      </Tooltip>
                    </div>
                  )}
                  {bagliFaturaNo && (
                  <div className="!flex !items-center !gap-3">
                    <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">Fatura</div>
                    <Tooltip title="Faturayı aç">
                      <Tag color="orange" onClick={handleFaturaAc} className="!cursor-pointer !text-[12px] !mr-0">
                        {bagliFaturaNo}
                      </Tag>
                    </Tooltip>
                  </div>
                  )}
                </div>
              </div>
              )}
            </div>
          </div>

          <div className="!border !border-gray-200 !rounded-sm !flex-1 !min-h-0 !flex !flex-col !mt-1.5">
            <div className="!flex !items-center !justify-between !px-3 !pt-2 !pb-1 !flex-shrink-0">
              <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide">Satır Detayları</div>
              <div className="!flex !items-center !gap-1">
                <Popover
                  content={kolonChooserContent}
                  title={<span className="!text-[12px] !font-semibold">Sütunlar</span>}
                  trigger="click"
                  placement="bottomRight"
                  open={kolonChooserOpen}
                  onOpenChange={(open) => {
                    setKolonChooserOpen(open)
                    if (!open) persistKolonlar()
                  }}
                >
                  <Button
                    size="small"
                    type="text"
                    icon={<SettingOutlined />}
                    className="!h-[28px] !w-[28px] !text-[#6b7280]"
                    title="Sütunları göster/gizle"
                  />
                </Popover>
                <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={addKalem} className="!text-[12px]">
                  Satır Ekle
                </Button>
              </div>
            </div>
            <div style={{ height: 220, width: '100%' }} className="kalemler-grid">
              <Dropdown menu={{ items: contextMenuItems }} trigger={['contextMenu']}>
                <div style={{ height: '100%', width: '100%' }}>
                  <AgGridReact
                    rowData={kalemler}
                    columnDefs={colDefs}
                    theme={antTheme}
                    headerHeight={32}
                    rowHeight={30}
                    rowSelection="single"
                    getRowId={(p) => p.data.key}
                    localeText={agGridLocaleTR}
                    defaultColDef={{ resizable: true, sortable: true }}
                    onGridReady={(e) => {
                      gridApiRef.current = e.api
                      tryLoadKolonFromDb(e.api)
                    }}
                    onCellContextMenu={(e: { data?: KalemRow | null }) => {
                      if (e.data) setSagTikSatir(e.data)
                    }}
                    onCellFocused={(e: CellFocusedEvent) => {
                      const colId = typeof e.column === 'object' && e.column ? e.column.getColId() : undefined
                      if (colId && colId !== 'key' && colId !== 'malzemeAd' && e.rowIndex != null) {
                        focusCellEditor(colId, e.rowIndex)
                      }
                    }}
                  />
                </div>
              </Dropdown>
            </div>
            <div className="!flex !items-center !justify-between !px-3 !py-2 !border-t !border-gray-100 !flex-shrink-0">
              <div className="!flex !items-center !gap-4">
                <span className="!text-[11px] !font-bold !text-[#6b7280] !uppercase !tracking-wide">Toplamlar</span>
                <div className="!flex !items-center !gap-3 !text-[12px] !text-[#333]">
                  <span>
                    Kalem: <span className="!font-semibold !tabular-nums">{kalemSayisi}</span>
                  </span>
                </div>
              </div>
              <div className="!text-[12px] !font-semibold !text-[#333] !flex !flex-col !items-end !gap-0.5">
                <div>Matrah: <span className="!tabular-nums">{numberFormat(toplamMatrah)}</span></div>
                <div>KDV: <span className="!tabular-nums">{numberFormat(toplamKdv)}</span></div>
                <div>Genel Toplam: <span className="!text-[#FF9933] !tabular-nums">{numberFormat(toplam)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={fasonGidenlerOpen}
        onCancel={() => setFasonGidenlerOpen(false)}
        width="95vw"
        title={<span className="!text-[13px] !font-semibold">Fason Gidenler — kalemleri içe aktar</span>}
        footer={[
          <Button key="vazgec" onClick={() => setFasonGidenlerOpen(false)} className="!text-[12px]">
            Vazgeç
          </Button>,
          <Button
            key="aktar"
            type="primary"
            onClick={iceriAktar}
            className="!text-[12px]"
          >
            Seçilenleri İçe Aktar
          </Button>,
        ]}
      >
        <Spin spinning={fasonGidenlerYukleniyor}>
          <div className="!flex !flex-col !gap-2">
            <div
              className={`!text-[11px] !px-2 !py-1 !rounded-sm !border ${
                cariKod
                  ? '!border-[#d9d9d9] !bg-[#fafafa] !text-[#333]'
                  : '!border-[#ffd591] !bg-[#fff7e6] !text-[#ad4e00]'
              }`}
            >
              {cariKod ? (
                <>
                  Cari: <span className="!font-semibold">{cariKod}</span>
                  {depoKod ? <> · Depo: <span className="!font-semibold">{depoKod}</span></> : null} — bu cariye
                  stok çıkışı yapılmış 134-Fasona Çıkış fişleri
                </>
              ) : (
                'Cari hesap seçilmedi — listede TÜM 134-Fasona Çıkış fişleri görünüyor. Sadece bu cariye ait '
                + 'fişleri görmek için cari hesabı seç.'
              )}
            </div>
            <Input
              size="small"
              placeholder="Fiş no, cari, malzeme veya boyahane rengi ara..."
              allowClear
              value={fasonGidenArama}
              onChange={(e) => setFasonGidenArama(e.target.value)}
              prefix={<SearchOutlined style={{ fontSize: 12, color: '#9ca3af' }} />}
              className="!w-80 !text-[12px]"
            />
            <div className="!text-[11px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
              Fasona Çıkış İrsaliyeleri — Kalemler ({fasonGidenSatirlar.length} satır, seçip içe aktarın)
            </div>
            <div style={{ height: 420 }}>
              <AgGridReact
                rowData={fasonGidenSatirlar}
                columnDefs={fasonGidenSatirKolonlar}
                theme={antTheme}
                headerHeight={30}
                rowHeight={28}
                rowSelection="multiple"
                localeText={agGridLocaleTR}
                defaultColDef={{ resizable: true, sortable: true }}
                onGridReady={(e) => { fasonGidenGridRef.current = e.api }}
              />
            </div>
          </div>
        </Spin>
      </Modal>
      <Modal
        open={acikTalimatlariOpen}
        onCancel={() => setAcikTalimatlariOpen(false)}
        width="95vw"
        title={<span className="!text-[13px] !font-semibold">Açık Talimatlar (202-Fason Talimatı) — Kalan miktarları içe aktar</span>}
        footer={[
          <Button key="vazgec" onClick={() => setAcikTalimatlariOpen(false)} className="!text-[12px]">
            Vazgeç
          </Button>,
          <Button
            key="aktar"
            type="primary"
            onClick={acikTalimatlariIceriAktar}
            className="!text-[12px]"
          >
            Seçilenleri İçe Aktar
          </Button>,
        ]}
      >
        <Spin spinning={acikTalimatlariYukleniyor}>
          <div className="!flex !flex-col !gap-2">
            <Input
              size="small"
              placeholder="Talimat no, cari veya fason tipi ara..."
              allowClear
              value={acikTalimatlariArama}
              onChange={(e) => setAcikTalimatlariArama(e.target.value)}
              prefix={<SearchOutlined style={{ fontSize: 12, color: '#9ca3af' }} />}
              className="!w-80 !text-[12px]"
            />
            <div className="!text-[11px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
              Fason Talimatları — Kalemler ({acikTalimatlariSatirlar.length} satır, seçip içe aktarın)
            </div>
            <div style={{ height: 420 }}>
              <AgGridReact
                rowData={acikTalimatlariSatirlar}
                columnDefs={acikTalimatlariKolonlar}
                theme={antTheme}
                headerHeight={30}
                rowHeight={28}
                rowSelection="multiple"
                localeText={agGridLocaleTR}
                defaultColDef={{ resizable: true, sortable: true }}
                onGridReady={(e) => { acikTalimatGridRef.current = e.api }}
              />
            </div>
          </div>
        </Spin>
      </Modal>
      <RaporSecimModal
        open={raporModalAcik}
        ekranAdi={ekranAdi || 'irsaliye'}
        parametreler={id ? { id } : undefined}
        onCancel={() => setRaporModalAcik(false)}
      />
      <Modal
        open={tahsisSatir != null}
        onCancel={() => setTahsisSatir(null)}
        width={560}
        title={
          <span className="!text-[13px] !font-semibold">
            Tahsis Detayları — {tahsisSatir?.malzemeKod} {tahsisSatir?.malzemeAd}
          </span>
        }
        footer={[
          <Button key="kapat" type="primary" onClick={() => setTahsisSatir(null)} className="!text-[12px]">
            Kapat
          </Button>,
        ]}
      >
        {(() => {
          const liste = tahsisSatir?.tahsis ?? []
          const tahsisToplam = liste.reduce((t, x) => t + (Number(x.miktar) || 0), 0)
          const satirMiktar = tahsisSatir ? hesapMiktariGetir(tahsisSatir) : 0
          const fark = satirMiktar - tahsisToplam
          return (
            <div className="!flex !flex-col !gap-2">
              <div className="!text-[11px] !text-[#6b7280]">
                Bu satırdaki miktarın hangi sipariş/model ihtiyacından geldiği (salt-okunur).
              </div>
              {liste.length === 0 ? (
                <div className="!text-[12px] !text-[#6b7280]">Bu satırda tahsis detayı yok.</div>
              ) : (
                <table className="!w-full !text-[12px] !border-collapse">
                  <thead>
                    <tr className="!bg-[#f9fafb] !text-[#6b7280] !text-left">
                      <th className="!font-semibold !px-2 !py-1 !border !border-gray-100">Sipariş</th>
                      <th className="!font-semibold !px-2 !py-1 !border !border-gray-100">Model</th>
                      <th className="!font-semibold !px-2 !py-1 !border !border-gray-100 !text-right">İhtiyaç</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liste.map((t, i) => (
                      <tr key={i} className={i % 2 === 1 ? '!bg-[#fafafa]' : ''}>
                        <td className="!px-2 !py-1 !border !border-gray-100">{t.siparisNo || '-'}</td>
                        <td className="!px-2 !py-1 !border !border-gray-100">{t.modelKod || '-'}</td>
                        <td className="!px-2 !py-1 !border !border-gray-100 !text-right !tabular-nums">
                          {(Number(t.miktar) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="!flex !items-center !justify-end !gap-4 !text-[12px] !text-[#333]">
                <span>Tahsis toplamı: <span className="!font-semibold !tabular-nums">{tahsisToplam.toLocaleString('tr-TR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</span></span>
                <span>Satır miktarı: <span className="!font-semibold !tabular-nums">{satirMiktar.toLocaleString('tr-TR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</span></span>
              </div>
              {Math.abs(fark) > 0.0005 && (
                <div className="!text-[12px] !bg-[#fff7ed] !border !border-[#fed7aa] !text-[#c2410c] !rounded-sm !px-2 !py-1.5">
                  Uyarı: satır miktarı sonradan değiştirilmiş — tahsis toplamından {Math.abs(fark).toLocaleString('tr-TR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} {fark > 0 ? 'fazla' : 'eksik'}.
                </div>
              )}
            </div>
          )
        })()}
      </Modal>
      <Modal
        open={prosesSatir != null}
        onCancel={() => setProsesSatir(null)}
        width={440}
        title={
          <span className="!text-[13px] !font-semibold">
            Prosesler — {prosesSatir?.malzemeKod} {prosesSatir?.malzemeAd}
          </span>
        }
        footer={[
          <Button key="vazgec" onClick={() => setProsesSatir(null)} className="!text-[12px]">
            Vazgeç
          </Button>,
          <Button key="kaydet" type="primary" onClick={handleProsesKaydet} className="!text-[12px]">
            Kaydet
          </Button>,
        ]}
      >
        <div className="!flex !flex-col !gap-2">
          <div className="!text-[11px] !text-[#6b7280]">
            Bu satırda yapılacak boyahane prosesleri (birden fazla seçilebilir). Her satırın sıra
            numarası formda yazılma sırasıdır. Prosesler Proses Tanımlarından (tip=2) gelir.
          </div>
          {prosesListesi.length === 0 ? (
            <div className="!text-[12px] !text-[#6b7280]">
              Seçilebilecek proses yok — Proses Tanımlarından (Malzeme Yönetimi) proses tanımlayın.
            </div>
          ) : (
            <div className="!flex !flex-col !gap-1">
              {prosesListesi.map((x) => {
                const acik = prosesSecili.includes(x.id)
                return (
                  <div key={x.id} className="!flex !items-center !gap-2">
                    <Switch size="small" checked={acik} onChange={(v) => toggleProses(x.id, v)} />
                    <span className="!text-[12px] !flex-1">
                      {x.kod} — {x.ad}
                    </span>
                    {acik && (
                      <InputNumber
                        min={1}
                        size="small"
                        value={prosesSiralar[x.id] ?? 0}
                        onChange={(v) => setProsesSiralar((prev) => ({ ...prev, [x.id]: Number(v) || 0 }))}
                        className="!w-16"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={barkodDetayOpen}
        onCancel={() => setBarkodDetayOpen(false)}
        width="90vw"
        title={
          <span className="!text-[13px] !font-semibold">
            Barkod Detayları — {barkodDetayKalem?.malzemeKod || '-'}
            {barkodDetayKalem?.malzemeAd ? ` · ${barkodDetayKalem.malzemeAd}` : ''}
          </span>
        }
        footer={[
          <Button key="kapat" onClick={() => setBarkodDetayOpen(false)} className="!text-[12px]">
            Kapat
          </Button>,
        ]}
      >
        <Spin spinning={barkodDetayLoading}>
          {barkodDetayRows.length === 0 ? (
            <div className="!py-8 !text-center !text-[12px] !text-[#9ca3af]">
              {barkodDetayLoading ? '' : 'Henüz kalite kontrol girişi yapılmamış'}
            </div>
          ) : (
            <div style={{ height: 420, width: '100%' }}>
              <AgGridReact
                rowData={barkodDetayRows}
                columnDefs={barkodDetayKolonlar}
                theme={antTheme}
                headerHeight={32}
                rowHeight={30}
                localeText={agGridLocaleTR}
                defaultColDef={{ resizable: true, sortable: true }}
                getRowId={(p) => String(p.data.id)}
              />
            </div>
          )}
        </Spin>
      </Modal>
    </Spin>
  )
}
