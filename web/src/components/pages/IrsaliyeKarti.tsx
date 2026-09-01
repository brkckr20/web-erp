'use client'

import { Input, DatePicker, Select, Button, App, Spin, Popconfirm, Tooltip, Popover, Checkbox, Modal, Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community'
import type { ColDef, GridApi, CellFocusedEvent } from 'ag-grid-community'
import dayjs from 'dayjs'
import { PlusOutlined, DeleteOutlined, SettingOutlined, SearchOutlined } from '@ant-design/icons'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import RaporSecimModal from '@/components/shared/RaporSecimModal'
import { formSabloniApi } from '@/lib/form-sabloni-api'
import { formTasarimDoc } from '@/lib/reports/form-tasarim.report'
import { previewPdf, generatePdf } from '@/lib/reports/pdf-common'
import type { FormTasarimDraft } from '@/components/pages/form-tasarimi/types'
import { htmlRaporApi, type HtmlRaporTemplate } from '@/lib/html-rapor-api'
import { htmlToPdf, htmlToPdfPreview } from '@/lib/html-rapor-utils'
import SearchableCariSelect from '@/components/shared/SearchableCariSelect'
import SearchableDepoSelect from '@/components/shared/SearchableDepoSelect'
import SearchableMalzemeSelect from '@/components/shared/SearchableMalzemeSelect'
import { irsaliyeApi, type Irsaliye, type IrsaliyeKalem } from '@/lib/irsaliye-api'
import { fasonTipiApi } from '@/lib/fason-tipi-api'
import { malzemeApi, type Malzeme } from '@/lib/malzeme-api'
import { cariHesapApi } from '@/lib/cari-hesap-api'
import { depoApi } from '@/lib/depo-api'
import { agGridLocaleTR } from '@/lib/ag-grid-locale'
import { kolonSecimiApi, type KolonKaydi } from '@/lib/kolon-secimi-api'
import { useAuth } from '@/context/AuthContext'

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
  onDeleted?: (irsaliyeTipi: string) => void
  baslangicKalemler?: IrsaliyeBaslangicKalem[]
  onCreateIrsaliye?: (irsaliyeTipi: string, kalemler: IrsaliyeBaslangicKalem[]) => void
}

export interface IrsaliyeBaslangicKalem {
  malzemeKod: string
  malzemeAd: string
  miktar: number
  birim: string
  birimFiyat?: number
  cariHesapKod?: string
  depoKod?: string
  aciklama?: string
}

interface KalemRow {
  key: string
  tip: string
  malzemeKod: string
  malzemeAd: string
  barkod: string
  brutKg: number
  kg: number
  brutMt: number
  mt: number
  adet: number
  hesapBirimi: string
  birimFiyat: number
  doviz: string
  kdv: number
  satirTutari: number
  aciklama: string
}

const emptyKalem = (): KalemRow => ({
  key: Math.random().toString(36).slice(2),
  tip: 'Malzeme',
  malzemeKod: '',
  malzemeAd: '',
  barkod: '',
  brutKg: 0,
  kg: 0,
  brutMt: 0,
  mt: 0,
  adet: 0,
  hesapBirimi: 'kg',
  birimFiyat: 0,
  doviz: 'TL',
  kdv: 0,
  satirTutari: 0,
  aciklama: '',
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
}

const fasonFisTipleri = ['6', '11', '12', '125', '133', '134']
const uretimKolonlari = ['tip', 'barkod', 'brutKg', 'kg', 'brutMt', 'mt', 'adet', 'hesapBirimi']
const satinalmaSiparisKolonlari = ['tip', 'barkod']
const defaultHiddenColsFor = (irsaliyeTipi: string): Set<string> => {
  const gizle = new Set<string>()
  if (irsaliyeTipi === '201') {
    satinalmaSiparisKolonlari.forEach((k) => gizle.add(k))
    return gizle
  }
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

export default function IrsaliyeKarti({ irsaliyeTipi = '120', fasonTipiId, id, onDeleted, baslangicKalemler, onCreateIrsaliye }: IrsaliyeKartiProps) {
  const { message } = App.useApp()
  const { modal } = App.useApp()
  const { kullanici } = useAuth()
  const kayitYapan = kullanici ? `${kullanici.kod} - ${kullanici.ad}` : null
  const irsaliyeTipiLabel = irsaliyeTipiMap[irsaliyeTipi] || irsaliyeTipi

  const [fasonTipiAd, setFasonTipiAd] = useState('')
  const [fasonTipiKayit, setFasonTipiKayit] = useState<number | null>(fasonTipiId ?? null)

  const [irsaliyeNo, setIrsaliyeNo] = useState('')
  const [cariKod, setCariKod] = useState<string>(() => baslangicKalemler?.[0]?.cariHesapKod ?? '')
  const [depoKod, setDepoKod] = useState<string>(() => baslangicKalemler?.[0]?.depoKod ?? '')
  const [irsaliyeTarihi, setIrsaliyeTarihi] = useState(dayjs())
  const [sevkTarihi, setSevkTarihi] = useState<dayjs.Dayjs | null>(null)
  const [belgeNo, setBelgeNo] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [onaylandi, setOnaylandi] = useState(false)
  const [tamamlandi, setTamamlandi] = useState(false)
  const [kalemler, setKalemler] = useState<KalemRow[]>(() =>
    !id && baslangicKalemler && baslangicKalemler.length > 0
      ? baslangicKalemler.map((b) => {
          const row = { ...emptyKalem(), malzemeKod: b.malzemeKod, malzemeAd: b.malzemeAd, hesapBirimi: 'mt', aciklama: b.aciklama ?? '', birimFiyat: b.birimFiyat ?? 0 }
          const val = b.miktar || 0
          if (b.birim === 'kg') { row.kg = val; row.hesapBirimi = 'kg' }
          else if (b.birim === 'adet') { row.adet = val; row.hesapBirimi = 'adet' }
          else { row.mt = val; row.hesapBirimi = 'mt' }
          return row
        })
      : [],
  )
  const [loading, setLoading] = useState<boolean>(() => Boolean(id))
  const gridApiRef = useRef<GridApi<KalemRow> | null>(null)
  const [raporModalAcik, setRaporModalAcik] = useState(false)
  const [sablonSecenekleri, setSablonSecenekleri] = useState<{ id: number; ad: string }[]>([])
  const [htmlSablonlari, setHtmlSablonlari] = useState<HtmlRaporTemplate[]>([])

  useEffect(() => {
    let cancelled = false
    if (id) {
      irsaliyeApi
        .get(id)
        .then((i) => {
          if (cancelled) return
          setIrsaliyeNo(i.irsaliyeNo)
          if (i.irsaliyeTarihi) setIrsaliyeTarihi(dayjs(i.irsaliyeTarihi))
          if (i.sevkTarihi) setSevkTarihi(dayjs(i.sevkTarihi))
          setBelgeNo(i.sevkNo ?? '')
          setAciklama(i.aciklama ?? '')
          setOnaylandi(!!i.onaylandi)
          setTamamlandi(!!i.tamamlandi)
          setFasonTipiKayit((i as Irsaliye).fasonTipiId ?? null)
          setFasonTipiAd((i as Irsaliye).fasonTipi?.ad ?? '')
          setCariKod((i as Irsaliye).cariHesap?.kod ?? String((i as Irsaliye).cariHesapId ?? ''))
          setDepoKod((i as Irsaliye).depo?.kod ?? String((i as Irsaliye).depoId ?? ''))
          const kalemList = (i as Irsaliye).kalemler ?? []
          const rows: KalemRow[] = kalemList.map((k) => ({
            key: Math.random().toString(36).slice(2),
            tip: (k as IrsaliyeKalem).tip ?? 'Malzeme',
            malzemeKod: (k as IrsaliyeKalem).malzeme?.kod ?? (k.malzemeId != null ? String(k.malzemeId) : ''),
            malzemeAd: (k as IrsaliyeKalem).malzeme?.ad ?? '',
            barkod: (k as IrsaliyeKalem).takipNo ?? (k as IrsaliyeKalem).malzeme?.barkod ?? '',
            brutKg: Number((k as IrsaliyeKalem).brutAgirlik) || 0,
            kg: Number((k as IrsaliyeKalem).netAgirlik) || 0,
            brutMt: Number((k as IrsaliyeKalem).brutMetre) || 0,
            mt: Number((k as IrsaliyeKalem).netMetre) || 0,
            adet: Number((k as IrsaliyeKalem).adet) || 0,
            hesapBirimi: (k as IrsaliyeKalem).olcuBirimi || 'kg',
            birimFiyat: Number(k.birimFiyat) || 0,
            doviz: (k as IrsaliyeKalem).doviz || 'TL',
            kdv: Number(k.kdv) || 0,
            satirTutari: Number(k.satirTutari) || 0,
            aciklama: k.aciklama ?? '',
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
  }, [id, irsaliyeTipi, message])

  useEffect(() => {
    if (!id && fasonTipiId) {
      fasonTipiApi
        .get(fasonTipiId)
        .then((f) => setFasonTipiAd(f.ad))
        .catch(() => {})
    }
  }, [id, fasonTipiId])

  const hesapMiktariGetir = (k: KalemRow): number => {
    switch (k.hesapBirimi) {
      case 'brutKg': return k.brutKg || 0
      case 'kg': return k.kg || 0
      case 'brutMt': return k.brutMt || 0
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
        const matrah = hesapMiktariGetir(next) * (next.birimFiyat || 0)
        next.satirTutari = matrah + matrah * (next.kdv || 0) / 100
        return next
      }),
    )
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

  const raporEkranTuru = useMemo(() => {
    if (irsaliyeTipi === '201') return 'Satın Alma Siparişleri'
    const satisTipleri = ['2', '3', '4', '8', '12', '23', '120', '121', '123', '125', '126', '134', '138', '192']
    return satisTipleri.includes(irsaliyeTipi) ? 'Satış İrsaliyeleri' : 'Satın Alma İrsaliyeleri'
  }, [irsaliyeTipi])

  const raporVerisiTopla = async (sablonId: number, irsaliyeId: number) => {
    const d = await formSabloniApi.getById(sablonId)
    const draft: FormTasarimDraft = {
      id: String(d.id),
      ad: d.ad,
      ekranTuru: d.ekranTuru,
      sorgular: (d.sorgular as FormTasarimDraft['sorgular']) ?? [],
      layout: (d.layout as FormTasarimDraft['layout']) ?? [],
      sayfa: (d.sayfa as FormTasarimDraft['sayfa']) ?? { boyut: 'A4', yon: 'dikey', kenarUst: 8, kenarAlt: 8, kenarSol: 10, kenarSag: 10 },
      sablonId: d.id,
      kod: d.kod,
    }
    const veri: Record<number, Record<string, unknown>[]> = {}
    for (const s of draft.sorgular) {
      if (!s.sorguMetni?.trim()) continue
      try {
        const sonuc = await formSabloniApi.sorguTest({ sorguMetni: s.sorguMetni, parametreler: { id: irsaliyeId } })
        veri[s.sirano] = sonuc.satirlar
      } catch {
        veri[s.sirano] = []
      }
    }
    return { draft, veri }
  }

  const handleRapor = async () => {
    if (!id) {
      modal.warning({ title: 'Yazdırma', content: 'İrsaliyeyi yazdırmak için önce kaydetmelisiniz.' })
      return
    }
    try {
      const [eskiList, htmlList] = await Promise.all([
        formSabloniApi.listByEkranTuru(raporEkranTuru).catch(() => []),
        htmlRaporApi.list(raporEkranTuru).catch(() => []),
      ])
      setSablonSecenekleri(eskiList.map((f) => ({ id: f.id, ad: f.ad })))
      setHtmlSablonlari(htmlList)
      if (eskiList.length === 0 && htmlList.length === 0) {
        modal.info({
          title: 'Form tasarımı yok',
          content: `Bu ekran için form tasarımı bulunamadı.`,
        })
        return
      }
      setRaporModalAcik(true)
    } catch {
      message.error('Form şablonları yüklenemedi')
    }
  }

  const handleHtmlOnizle = async (templateId: string) => {
    if (!id) return
    try {
      const tmpl = await htmlRaporApi.getById(templateId)
      const data = await htmlRaporApi.getData(templateId, id)
      const header = data[0] ?? {}
      const kalemler = data.slice(1)
      await htmlToPdfPreview(tmpl.html, header, kalemler, {
        boyut: (tmpl.sayfaBoyut as 'A5' | 'A4') ?? 'A5',
        yon: (tmpl.sayfaYon as 'yatay' | 'dikey') ?? 'yatay',
        logo: tmpl.logoBase64 || '',
      })
    } catch (e) {
      message.error('HTML rapor hazırlanamadı: ' + (e instanceof Error ? e.message : 'bilinmeyen hata'))
    }
  }

  const handleHtmlIndir = async (templateId: string) => {
    if (!id) return
    try {
      const tmpl = await htmlRaporApi.getById(templateId)
      const data = await htmlRaporApi.getData(templateId, id)
      const header = data[0] ?? {}
      const kalemler = data.slice(1)
      await htmlToPdf(tmpl.html, header, kalemler, {
        fileName: `rapor-${irsaliyeNo || 'yeni'}.pdf`,
        boyut: (tmpl.sayfaBoyut as 'A5' | 'A4') ?? 'A5',
        yon: (tmpl.sayfaYon as 'yatay' | 'dikey') ?? 'yatay',
        logo: tmpl.logoBase64 || '',
      })
    } catch (e) {
      message.error('HTML rapor indirilemedi: ' + (e instanceof Error ? e.message : 'bilinmeyen hata'))
    }
  }

  const handleSabloniOnizle = async (sablonId: number) => {
    if (!id) {
      modal.warning({ title: 'Yazdırma', content: 'İrsaliyeyi yazdırmak için önce kaydetmelisiniz.' })
      return
    }
    try {
      const { draft, veri } = await raporVerisiTopla(sablonId, id)
      await previewPdf(formTasarimDoc(draft, veri))
    } catch (e) {
      message.error('Rapor hazırlanamadı: ' + (e instanceof Error ? e.message : 'bilinmeyen hata'))
    }
  }

  const handleSabloniIndir = async (sablonId: number) => {
    if (!id) {
      modal.warning({ title: 'Yazdırma', content: 'İrsaliyeyi yazdırmak için önce kaydetmelisiniz.' })
      return
    }
    try {
      const { draft, veri } = await raporVerisiTopla(sablonId, id)
      await generatePdf(formTasarimDoc(draft, veri), `irsaliye-${irsaliyeNo || 'yeni'}.pdf`)
    } catch (e) {
      message.error('Rapor indirilemedi: ' + (e instanceof Error ? e.message : 'bilinmeyen hata'))
    }
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
        malzemeId: malzemeList.find((m) => m.kod === k.malzemeKod)?.id ?? null,
        tip: k.tip || null,
        takipNo: k.barkod || null,
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
        satirTutari: k.satirTutari,
        aciklama: k.aciklama || null,
      }))

      if (id) {
        await irsaliyeApi.update(id, {
          irsaliyeTarihi: irsaliyeTarihi.format('YYYY-MM-DD'),
          sevkTarihi: sevkTarihi ? sevkTarihi.format('YYYY-MM-DD') : null,
          sevkNo: belgeNo || null,
          onaylandi,
          tamamlandi,
          aciklama: aciklama || null,
          cariHesapId,
          depoId,
          fasonTipiId: fasonTipiKayit,
          guncelleyen: kayitYapan,
          kalemler: kalemPayload,
         } as Irsaliye)
      message.success('İrsaliye güncellendi')
    } else {
      await irsaliyeApi.create({
        irsaliyeNo,
        irsaliyeTipi,
        irsaliyeTarihi: irsaliyeTarihi.format('YYYY-MM-DD'),
        sevkTarihi: sevkTarihi ? sevkTarihi.format('YYYY-MM-DD') : null,
        sevkNo: belgeNo || null,
        onaylandi,
        tamamlandi: ['1','2','3','4','5','8','9','11','12','120','121','122','123','124','134'].includes(irsaliyeTipi) ? true : tamamlandi,
        aciklama: aciklama || null,
        cariHesapId,
        depoId,
        fasonTipiId: fasonTipiKayit,
        kayitYapan,
        kalemler: kalemPayload,
      })
      message.success('İrsaliye ve kalemler kaydedildi')
    }
  } catch (err: unknown) {
    message.error('Hata: ' + ((err as Error)?.message ?? String(err)))
  } finally {
    setLoading(false)
    }
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
    const editableCols = colDefs.map((c) => c.field as string).filter((f) => f && f !== 'key' && f !== 'malzemeAd')
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
        <div className="!flex !items-center !justify-center !h-full">
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
            updateKalem(p.data.key, { malzemeKod: kod, malzemeAd: (rec as Malzeme)?.ad ?? '', barkod, kdv, hesapBirimi })
            if (kod && p.node.rowIndex != null) focusNextCell('malzemeKod', p.node.rowIndex)
          }}
        />
      ),
    },
    { headerName: 'Malzeme Adı', field: 'malzemeAd', flex: 1, minWidth: 120 },
    {
      headerName: 'Barkod', field: 'barkod', width: 120, resizable: true,
      valueFormatter: (p) => p.value || '-',
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
  const [fasonGidenlerYukleniyor, setFasonGidenlerYukleniyor] = useState(false)
  const [fasonGidenArama, setFasonGidenArama] = useState('')
  const fasonGidenGridRef = useRef<GridApi>(null)

  const openFasonGidenler = () => {
    setFasonGidenlerOpen(true)
    setFasonGidenlerYukleniyor(true)
    setFasonGidenArama('')
    irsaliyeApi
      .list()
      .then((res) => setFasonGidenlerData(res.filter((i) => String(i.irsaliyeTipi) === '134')))
      .catch(() => setFasonGidenlerData([]))
      .finally(() => setFasonGidenlerYukleniyor(false))
  }

  const handleIrsaliyeOlustur = () => {
    const secili = gridApiRef.current?.getSelectedRows() as KalemRow[] | undefined
    const kaynak = secili && secili.length > 0 ? secili : kalemler.filter((k) => Boolean(k.malzemeKod))
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
      kalemlerOut.push({
        malzemeKod: k.malzemeKod,
        malzemeAd: k.malzemeAd,
        miktar,
        birim,
        birimFiyat: k.birimFiyat || undefined,
        cariHesapKod: cariKod || undefined,
        depoKod: depoKod || undefined,
        aciklama: k.aciklama || undefined,
      })
    }
    onCreateIrsaliye?.('1', kalemlerOut)
  }

  const contextMenuItems: MenuProps['items'] =
    irsaliyeTipi === '11'
      ? [{ key: 'fason-gidenler', label: 'Fason Gidenler (134)...', onClick: () => openFasonGidenler() }]
      : irsaliyeTipi === '201'
        ? [
            { key: 'irsaliye-olustur', label: 'İrsaliye Oluştur', onClick: handleIrsaliyeOlustur },
          ]
        : []

  const iceriAktar = () => {
    const secili = fasonGidenGridRef.current?.getSelectedRows() ?? []
    if (secili.length === 0) {
      message.warning('İçe aktarılacak kalem seçiniz')
      return
    }
    const yeniKalemler: KalemRow[] = secili.map((k: IrsaliyeKalem) => ({
      key: Math.random().toString(36).slice(2),
      tip: k.tip ?? 'Malzeme',
      malzemeKod: k.malzeme?.kod ?? (k.malzemeId != null ? String(k.malzemeId) : ''),
      malzemeAd: k.malzeme?.ad ?? '',
      barkod: k.id != null ? String(k.id) : (k.takipNo ?? ''),
      brutKg: Number(k.brutAgirlik) || 0,
      kg: Number(k.netAgirlik) || 0,
      brutMt: Number(k.brutMetre) || 0,
      mt: Number(k.netMetre) || 0,
      adet: Number(k.adet) || 0,
      hesapBirimi: k.olcuBirimi || 'kg',
      birimFiyat: 0,
      doviz: 'TL',
      kdv: 0,
      satirTutari: 0,
      aciklama: k.aciklama ?? '',
    }))
    setKalemler((prev) => {
      const bosMu = prev.every((p) => !p.malzemeKod)
      return bosMu ? yeniKalemler : [...prev, ...yeniKalemler]
    })
    message.success(`${yeniKalemler.length} kalem içe aktarıldı`)
    setFasonGidenlerOpen(false)
  }

  const fasonGidenlerFiltreli = fasonGidenlerData.filter(
    (d) =>
      !fasonGidenArama ||
      `${d.irsaliyeNo} ${d.cariHesap?.ad ?? ''} ${d.cariHesap?.kod ?? ''} ${d.sevkNo ?? ''}`
        .toLocaleLowerCase('tr-TR')
        .includes(fasonGidenArama.toLocaleLowerCase('tr-TR')),
  )

  const fasonGidenSatirlar = useMemo(() => {
    const gorilenMiktar = new Map<string, number>()
    for (const k of kalemler) {
      if (!k.barkod) continue
      const birim = k.hesapBirimi
      let m = 0
      if (birim === 'brutKg') m = k.brutKg
      else if (birim === 'kg') m = k.kg
      else if (birim === 'brutMt') m = k.brutMt
      else if (birim === 'mt') m = k.mt
      else if (birim === 'adet') m = k.adet
      gorilenMiktar.set(k.barkod, (gorilenMiktar.get(k.barkod) ?? 0) + m)
    }
    const kaynakMiktar = (k: IrsaliyeKalem): number => {
      switch (k.olcuBirimi) {
        case 'brutKg': return Number(k.brutAgirlik) || 0
        case 'kg': return Number(k.netAgirlik) || 0
        case 'brutMt': return Number(k.brutMetre) || 0
        case 'mt': return Number(k.netMetre) || 0
        case 'adet': return Number(k.adet) || 0
        default: return 0
      }
    }
    const rows: (IrsaliyeKalem & {
      fisNo: string
      belgeNo: string
      tarih: string | null
      cariAd: string
      fasonTipiAd: string
      kalan: number
    })[] = []
    for (const i of fasonGidenlerFiltreli) {
      for (const k of i.kalemler ?? []) {
        const idStr = k.id != null ? String(k.id) : null
        const kalan = kaynakMiktar(k) - (idStr ? (gorilenMiktar.get(idStr) ?? 0) : 0)
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
  }, [fasonGidenlerFiltreli, kalemler])

  const fasonGidenSatirKolonlar = useMemo<ColDef<any>[]>(
    () => [
      { headerName: 'Çıkış Fiş No', field: 'fisNo', width: 110, cellClass: '!text-[#f57c00] !font-medium' },
      { headerName: 'Belge No', field: 'belgeNo', width: 100, valueFormatter: (p) => p.value || '-' },
      { headerName: 'Tarih', field: 'tarih', width: 100, valueFormatter: (p) => formatTarih(p.value) },
      { headerName: 'Cari Hesap', field: 'cariAd', flex: 1, minWidth: 120, valueFormatter: (p) => p.value || '-' },
      { headerName: 'Fason Alt Tipi', field: 'fasonTipiAd', width: 140, valueFormatter: (p) => p.value || '-' },
      { headerName: 'Tip', field: 'tip', width: 80, valueFormatter: (p) => p.value || '-' },
      { headerName: 'Malzeme Kodu', field: 'malzeme.kod', width: 110, valueFormatter: (p) => p.value || '-' },
      { headerName: 'Malzeme Adı', field: 'malzeme.ad', flex: 1, minWidth: 140, valueFormatter: (p) => p.value || '-' },
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
  const toplamMatrah = kalemler.reduce((acc, k) => acc + hesapMiktariGetir(k) * (k.birimFiyat || 0), 0)
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
              onReport: handleRapor,
            }, {
              delete: { onClick: handleSil, label: 'Sil', disabled: !id, danger: true },
            })}
          />
        </div>
        <RaporSecimModal
          open={raporModalAcik}
          baslik={irsaliyeTipiLabel}
          tasarimlar={[
            ...htmlSablonlari.map((h) => ({
              id: `html:${h.id}`,
              label: `${h.ad} (HTML)`,
              aciklama: h.aciklama || 'HTML tabanlı rapor',
            })),
            ...sablonSecenekleri.map((s) => ({
              id: String(s.id),
              label: s.ad,
              aciklama: 'Form tasarım editöründe hazırlandı',
            })),
          ]}
          onCancel={() => setRaporModalAcik(false)}
          onOnizle={(tid) => {
            if (tid.startsWith('html:')) handleHtmlOnizle(tid.slice(5))
            else handleSabloniOnizle(Number(tid))
          }}
          onIndir={(tid) => {
            if (tid.startsWith('html:')) handleHtmlIndir(tid.slice(5))
            else handleSabloniIndir(Number(tid))
          }}
        />
        <div className="!flex-1 !min-h-0 !flex !flex-col">
          <div className="!flex-shrink-0 !space-y-1.5">
            <div className="!flex !gap-2">
              <div className="!shrink-0 !border !border-gray-200 !rounded-sm !p-2">
                <div className="!text-[12px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-1">Genel Bilgiler</div>
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
                    <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">{irsaliyeTipi === '201' ? 'Teslim Tarihi' : 'Sevk Tarihi'}</div>
                    <DatePicker size="small" value={sevkTarihi} onChange={(d) => setSevkTarihi(d)} format="DD.MM.YYYY" placeholder={irsaliyeTipi === '201' ? 'Teslim tarihi' : 'Sevk tarihi'} className="!w-48 !text-[12px]" />
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
                  {irsaliyeTipi === '201' && (
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
                  {fasonTipiAd && (
                    <div className="!flex !items-center !gap-3">
                      <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">Fiş Alt Tipi</div>
                      <Input size="small" value={fasonTipiAd} readOnly className="!w-48 !text-[12px]" />
                    </div>
                  )}
                </div>
              </div>

              <div className="!flex-1 !border !border-gray-200 !rounded-sm !p-2">
                <div className="!text-[12px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-1">Cari Hesap Bilgileri</div>
                <div className="!space-y-0.5">
                  <div className="!flex !items-center !gap-3">
                    <div className="!text-[12px] !text-[red] !w-24 !shrink-0">Cari Hesap</div>
                    <SearchableCariSelect value={cariKod} onChange={(kod) => setCariKod(kod)} />
                  </div>
                  <div className="!flex !items-center !gap-3">
                    <div className="!text-[12px] !text-[red] !w-24 !shrink-0">Depo</div>
                    <SearchableDepoSelect value={depoKod} onChange={(kod) => setDepoKod(kod)} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="!border !border-gray-200 !rounded-sm !flex-1 !min-h-0 !flex !flex-col !mt-1.5">
            <div className="!flex !items-center !justify-between !px-3 !pt-2 !pb-1 !flex-shrink-0">
              <div className="!text-[12px] !font-bold !text-[#333] !uppercase !tracking-wide">Satır Detayları</div>
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
        title={<span className="!text-[13px] !font-semibold">Fason Gidenler (134-Fasona Çıkış) — kalemleri içe aktar</span>}
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
            <Input
              size="small"
              placeholder="Çıkış fiş no, belge no veya cari ara..."
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
    </Spin>
  )
}
