'use client'

import { Input, DatePicker, Select, Button, App, Spin, Modal, Checkbox, Popconfirm, Tooltip, Popover, Dropdown, Tag } from 'antd'
import type { MenuProps } from 'antd'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community'
import type { ColDef, GridApi, CellFocusedEvent } from 'ag-grid-community'
import dayjs from 'dayjs'
import { PlusOutlined, DeleteOutlined, SettingOutlined, SearchOutlined, LinkOutlined } from '@ant-design/icons'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import SearchableCariSelect from '@/components/shared/SearchableCariSelect'
import SearchableDepoSelect from '@/components/shared/SearchableDepoSelect'
import SearchableMalzemeSelect from '@/components/shared/SearchableMalzemeSelect'
import SearchableRenkSelect from '@/components/shared/SearchableRenkSelect'
import { faturaApi, type Fatura, type FaturaKalem, type FaturaFormData } from '@/lib/fatura-api'
import type { Irsaliye } from '@/lib/irsaliye-api'
import { irsaliyeApi } from '@/lib/irsaliye-api'
import { fasonTipiApi } from '@/lib/fason-tipi-api'
import { malzemeApi, type Malzeme } from '@/lib/malzeme-api'
import { cariHesapApi } from '@/lib/cari-hesap-api'
import { depoApi } from '@/lib/depo-api'
import { agGridLocaleTR } from '@/lib/ag-grid-locale'
import { kolonSecimiApi, type KolonKaydi } from '@/lib/kolon-secimi-api'
import { useAuth } from '@/context/AuthContext'
import RaporSecimModal from '@/components/shared/RaporSecimModal'
import { faturaTipiLabelMap } from './FaturaListesi'

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

interface FaturaKartiProps {
  faturaTipi?: string
  fasonTipiId?: number | null
  id?: number
  ekranAdi?: string
  baslangicIrsaliyeIds?: number[]
  onDeleted?: (faturaTipi: string) => void
  onOpenIrsaliye?: (info: { id: number; irsaliyeTipi: string; irsaliyeNo: string }) => void
}

interface KalemRow {
  key: string
  /** Doluysa irsaliyeden snapshot: miktar kolonları kilitli. */
  irsaliyeKalemId: number | null
  irsaliyeNo: string
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
  varyant1RenkId: number | null
  varyant1RenkKod: string
  varyant1RenkAd: string
  boyahaneRenkId: number | null
  boyahaneRenkKod: string
  boyahaneRenkAd: string
}

const emptyKalem = (tip: KalemRow['tip'] = 'Malzeme'): KalemRow => ({
  key: Math.random().toString(36).slice(2),
  irsaliyeKalemId: null,
  irsaliyeNo: '',
  tip,
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
  varyant1RenkId: null,
  varyant1RenkKod: '',
  varyant1RenkAd: '',
  boyahaneRenkId: null,
  boyahaneRenkKod: '',
  boyahaneRenkAd: '',
})

// Fason fişleri: miktarlar brüt/net ayrı girilir (irsaliye ile aynı kolon seti).
const fasonFisTipleri = ['6', '11', '12', '125', '133', '134']
const uretimKolonlari = ['tip', 'barkod', 'brutKg', 'kg', 'brutMt', 'mt', 'adet', 'hesapBirimi']
const defaultHiddenColsFor = (): Set<string> => new Set<string>()

const formatTR = (v: number) => {
  if (v === 0) return ''
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
}

const parseTR = (s: string) => {
  if (!s) return 0
  return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
}

const numberFormat = (v: number) => (v ?? 0).toFixed(2)

function TurkishNumberInput({ value, onChange, onEnter, disabled, className }: { value: number; onChange: (v: number) => void; onEnter?: () => void; disabled?: boolean; className?: string }) {
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState('')
  const display = focused ? draft : formatTR(value)
  return (
    <Input
      size="small"
      type="text"
      disabled={disabled}
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

function CellTextInput({ value, onCommit, onEnter, className }: { value: string; onCommit: (v: string) => void; onEnter?: () => void; className?: string }) {
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

export default function FaturaKarti({ faturaTipi = '120', fasonTipiId, id: propId, ekranAdi, baslangicIrsaliyeIds, onDeleted, onOpenIrsaliye }: FaturaKartiProps) {
  const { message, modal } = App.useApp()
  const { kullanici } = useAuth()
  const kayitYapan = kullanici ? `${kullanici.kod} - ${kullanici.ad}` : null
  const faturaTipiLabel = faturaTipiLabelMap[faturaTipi] || faturaTipi
  const [localId, setLocalId] = useState<number | undefined>(propId)
  const id = localId

  const [fasonTipiAd, setFasonTipiAd] = useState('')
  const [fasonTipiKayit, setFasonTipiKayit] = useState<number | null>(fasonTipiId ?? null)
  const [fasonTipleri, setFasonTipleri] = useState<{ id: number; ad: string }[]>([])

  const [faturaNo, setFaturaNo] = useState('')
  const [cariKod, setCariKod] = useState('')
  const [depoKod, setDepoKod] = useState('')
  const [faturaTarihi, setFaturaTarihi] = useState(dayjs())
  const [sevkTarihi, setSevkTarihi] = useState<dayjs.Dayjs | null>(null)
  const [belgeNo, setBelgeNo] = useState('')
  const [bagliIrsaliyeler, setBagliIrsaliyeler] = useState<{ id: number; irsaliyeTipi: string; irsaliyeNo: string | null }[]>([])
  const [aciklama, setAciklama] = useState('')
  const [yetkili, setYetkili] = useState('')
  const [kalemler, setKalemler] = useState<KalemRow[]>([])
  const [loading, setLoading] = useState<boolean>(() => Boolean(propId))
  const [raporModalAcik, setRaporModalAcik] = useState(false)
  const [irsaliyeModal, setIrsaliyeModal] = useState(false)
  const [baglanabilir, setBaglanabilir] = useState<Irsaliye[]>([])
  const [baglanabilirArama, setBaglanabilirArama] = useState('')
  const [seciliIrsaliyeler, setSeciliIrsaliyeler] = useState<number[]>([])
  const gridApiRef = useRef<GridApi<KalemRow> | null>(null)

  useEffect(() => {
    setLocalId(propId)
  }, [propId])

  useEffect(() => {
    let cancelled = false
    if (propId) {
      faturaApi
        .get(propId)
        .then((f) => {
          if (cancelled) return
          setFaturaNo(f.faturaNo)
          if (f.faturaTarihi) setFaturaTarihi(dayjs(f.faturaTarihi))
          if (f.sevkTarihi) setSevkTarihi(dayjs(f.sevkTarihi))
          setBelgeNo(f.sevkNo ?? '')
          setAciklama(f.aciklama ?? '')
          setYetkili(f.yetkili ?? '')
          setFasonTipiKayit(f.fasonTipiId ?? null)
          setFasonTipiAd(f.fasonTipi?.ad ?? '')
          setCariKod(f.cariHesap?.kod ?? '')
          setDepoKod(f.depo?.kod ?? '')
          setBagliIrsaliyeler(f.irsaliyeler ?? [])
          const rows: KalemRow[] = (f.kalemler ?? []).map((k) => ({
            key: Math.random().toString(36).slice(2),
            irsaliyeKalemId: k.irsaliyeKalemId ?? null,
            irsaliyeNo: '',
            tip: k.tip ?? 'Malzeme',
            malzemeKod: k.malzeme?.kod ?? '',
            malzemeAd: k.malzeme?.ad ?? '',
            barkod: k.takipNo ?? '',
            brutKg: Number(k.brutAgirlik) || 0,
            kg: Number(k.netAgirlik) || 0,
            brutMt: Number(k.brutMetre) || 0,
            mt: Number(k.netMetre) || 0,
            adet: Number(k.adet) || 0,
            hesapBirimi: k.olcuBirimi || 'kg',
            birimFiyat: Number(k.birimFiyat) || 0,
            doviz: k.doviz || 'TL',
            kdv: Number(k.kdv) || 0,
            satirTutari: Number(k.satirTutari) || 0,
            aciklama: k.aciklama ?? '',
            varyant1RenkId: k.varyant1RenkId ?? k.varyant1Renk?.id ?? null,
            varyant1RenkKod: k.varyant1Renk?.kod ?? '',
            varyant1RenkAd: k.varyant1Renk?.ad ?? '',
            boyahaneRenkId: k.boyahaneRenkId ?? k.boyahaneRenk?.id ?? null,
            boyahaneRenkKod: k.boyahaneRenk?.kod ?? '',
            boyahaneRenkAd: k.boyahaneRenk?.ad ?? '',
          }))
          setKalemler(rows.length > 0 ? rows : [])
        })
        .catch((err) => message.error('Fatura yüklenemedi: ' + (err?.message || err)))
        .finally(() => { if (!cancelled) setLoading(false) })
    } else {
      faturaApi
        .nextFaturaNo(faturaTipi)
        .then((res) => setFaturaNo(res.faturaNo))
        .catch(() => setFaturaNo('00000001'))
    }
    return () => { cancelled = true }
  }, [propId, faturaTipi, message])

  useEffect(() => {
    fasonTipiApi
      .list()
      .then((list) => setFasonTipleri(list.filter((f) => f.kullanimda).map((f) => ({ id: f.id, ad: f.ad }))))
      .catch(() => setFasonTipleri([]))
  }, [])

  useEffect(() => {
    if (!id && fasonTipiId) {
      fasonTipiApi
        .get(fasonTipiId)
        .then((f) => setFasonTipiAd(f.ad))
        .catch(() => {})
    }
  }, [id, fasonTipiId])

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
        const matrah = hesapMiktariGetir(next) * (next.birimFiyat || 0)
        next.satirTutari = matrah + matrah * (next.kdv || 0) / 100
        return next
      }),
    )
  }

  // 22-Alınan Hizmet Faturası: yeni satırlar Hizmet tipli açılır, kod listesi hizmet kartlarından gelir.
  const varsayilanKalemTip: KalemRow['tip'] = faturaTipi === '22' ? 'Hizmet' : 'Malzeme'

  const addKalem = () => setKalemler((prev) => [...prev, emptyKalem(varsayilanKalemTip)])
  const removeKalem = (key: string) =>
    setKalemler((prev) => {
      if (prev.length > 1) return prev.filter((k) => k.key !== key)
      return prev.map((k) => (k.key === key ? { ...emptyKalem(varsayilanKalemTip), key: k.key } : k))
    })

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

  const addKalemAndFocusMalzeme = () => {
    let newIndex = 0
    setKalemler((prev) => {
      newIndex = prev.length
      return [...prev, emptyKalem(varsayilanKalemTip)]
    })
    setTimeout(() => focusCellEditor('malzemeKod', newIndex), 50)
  }

  const openIrsaliyeModal = async () => {
    try {
      const list = await faturaApi.baglanabilirIrsaliyeler()
      setBaglanabilir(list)
      setBaglanabilirArama('')
      setSeciliIrsaliyeler([])
      setIrsaliyeModal(true)
    } catch (err: unknown) {
      message.error('İrsaliyeler alınamadı: ' + ((err as Error)?.message ?? String(err)))
    }
  }

  // İrsaliye listesinden "Fatura Oluştur" ile açıldıysa: kalemler kilitli taşınır.
  const irsaliyelerdenSatirlar = (secilen: Irsaliye[]): KalemRow[] => {
    const rows: KalemRow[] = []
    for (const irs of secilen) {
      for (const k of irs.kalemler ?? []) {
        rows.push({
          key: Math.random().toString(36).slice(2),
          irsaliyeKalemId: k.id ?? null,
          irsaliyeNo: irs.irsaliyeNo ?? '',
          tip: k.tip ?? 'Malzeme',
          malzemeKod: k.malzeme?.kod ?? '',
          malzemeAd: k.malzeme?.ad ?? '',
          barkod: k.takipNo ?? '',
          brutKg: Number(k.brutAgirlik) || 0,
          kg: Number(k.netAgirlik) || 0,
          brutMt: Number(k.brutMetre) || 0,
          mt: Number(k.netMetre) || 0,
          adet: Number(k.adet) || 0,
          hesapBirimi: k.olcuBirimi || 'kg',
          birimFiyat: Number(k.birimFiyat) || 0,
          doviz: k.doviz || 'TL',
          kdv: Number(k.kdv) || 0,
          satirTutari: Number(k.satirTutari) || 0,
          aciklama: k.aciklama ?? '',
          varyant1RenkId: k.varyant1RenkId ?? k.varyant1Renk?.id ?? null,
          varyant1RenkKod: k.varyant1Renk?.kod ?? '',
          varyant1RenkAd: k.varyant1Renk?.ad ?? '',
          boyahaneRenkId: k.boyahaneRenkId ?? k.boyahaneRenk?.id ?? null,
          boyahaneRenkKod: k.boyahaneRenk?.kod ?? '',
          boyahaneRenkAd: k.boyahaneRenk?.ad ?? '',
        })
      }
    }
    return rows
  }

  useEffect(() => {
    if (propId || !baslangicIrsaliyeIds?.length) return
    let cancelled = false
    setLoading(true)
    Promise.all(baslangicIrsaliyeIds.map((irsId) => irsaliyeApi.get(irsId)))
      .then((list) => {
        if (cancelled) return
        if (list[0]?.cariHesap?.kod) setCariKod(list[0].cariHesap.kod)
        setKalemler(irsaliyelerdenSatirlar(list))
      })
      .catch((err) => message.error('İrsaliye kalemleri alınamadı: ' + (err?.message || err)))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propId])

  const confirmIrsaliyeEkle = () => {
    const secilen = baglanabilir.filter((i) => seciliIrsaliyeler.includes(i.id))
    if (secilen.length === 0) {
      message.warning('İrsaliye seçilmedi')
      return
    }
    if (!cariKod && secilen[0]?.cariHesap?.kod) setCariKod(secilen[0].cariHesap.kod)
    const rows = irsaliyelerdenSatirlar(secilen)
    setKalemler((prev) => {
      const bosMu = prev.every((p) => !p.malzemeKod)
      return bosMu ? rows : [...prev, ...rows]
    })
    setIrsaliyeModal(false)
    message.success(`${secilen.length} irsaliyeden ${rows.length} kalem aktarıldı (miktarlar kilitli)`)
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
        irsaliyeKalemId: k.irsaliyeKalemId,
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
        varyant1RenkId: k.varyant1RenkId,
        boyahaneRenkId: k.boyahaneRenkId,
      })) as FaturaKalem[]

      if (id) {
        await faturaApi.update(id, {
          faturaTarihi: faturaTarihi.format('YYYY-MM-DD'),
          sevkTarihi: sevkTarihi ? sevkTarihi.format('YYYY-MM-DD') : null,
          sevkNo: belgeNo || null,
          aciklama: aciklama || null,
          cariHesapId,
          depoId,
          fasonTipiId: fasonTipiKayit,
          yetkili: yetkili || null,
          guncelleyen: kayitYapan,
          kalemler: kalemPayload,
        } as Fatura)
        message.success('Fatura güncellendi')
      } else {
        const created = await faturaApi.create({
          faturaNo,
          faturaTipi,
          faturaTarihi: faturaTarihi.format('YYYY-MM-DD'),
          sevkTarihi: sevkTarihi ? sevkTarihi.format('YYYY-MM-DD') : null,
          sevkNo: belgeNo || null,
          aciklama: aciklama || null,
          cariHesapId,
          depoId,
          fasonTipiId: fasonTipiKayit,
          yetkili: yetkili || null,
          kayitYapan,
          kalemler: kalemPayload,
        } as FaturaFormData & { kalemler: FaturaKalem[] })
        setLocalId(created.id)
        setBagliIrsaliyeler(created.irsaliyeler ?? [])
        message.success(
          (created.kalemler ?? []).some((k) => k.irsaliyeKalemId != null)
            ? 'Fatura ve kalemler kaydedildi'
            : 'Fatura kaydedildi (otomatik irsaliye oluştu)',
        )
      }
    } catch (err: unknown) {
      message.error('Hata: ' + ((err as Error)?.message ?? String(err)))
    } finally {
      setLoading(false)
    }
  }

  const handleSil = () => {
    if (!id) {
      message.warning('Önce kaydedilmiş bir fatura olmalı')
      return
    }
    modal.confirm({
      title: 'Faturayı Sil',
      content: `${faturaTipiLabel} - ${faturaNo} faturasını silmek istediğinize emin misiniz?`,
      okText: 'Evet, sil',
      okButtonProps: { danger: true },
      cancelText: 'Vazgeç',
      onOk: async () => {
        try {
          await faturaApi.remove(id)
          message.success('Fatura silindi')
          onDeleted?.(faturaTipi)
        } catch (err: unknown) {
          message.error('Fatura silinirken hata: ' + ((err as Error)?.message ?? String(err)))
        }
      },
    })
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
      headerName: 'Kaynak', field: 'irsaliyeNo', width: 90, resizable: true,
      valueFormatter: (p) => (p.data?.irsaliyeKalemId != null ? `🔒 ${p.value || 'İrs.'}` : ''),
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
          tip={p.data.tip === 'Hizmet' ? 6 : undefined}
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
      headerName: 'Varyant 1', field: 'varyant1RenkId', width: 130, cellClass: '!p-0',
      cellRenderer: (p: { data: KalemRow }) => (
        <SearchableRenkSelect
          value={p.data.varyant1RenkId}
          adGoster={false}
          widthClass="!w-full"
          className="!w-full !h-full"
          onChange={(renkId, rec) => updateKalem(p.data.key, {
            varyant1RenkId: renkId ?? null,
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
    ...(fasonFisTipleri.includes(faturaTipi)
      ? [
          {
            headerName: 'Boyahane Renk Kodu', field: 'boyahaneRenkId', width: 130, cellClass: '!p-0',
            cellRenderer: (p: { data: KalemRow }) => (
              <SearchableRenkSelect
                tip={2}
                value={p.data.boyahaneRenkId}
                adGoster={false}
                widthClass="!w-full"
                className="!w-full !h-full"
                onChange={(renkId, rec) => updateKalem(p.data.key, {
                  boyahaneRenkId: renkId ?? null,
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
        ]
      : []),
    {
      headerName: 'Barkod', field: 'barkod', width: 120, resizable: true,
      valueFormatter: (p) => p.value || '-',
    },
    {
      headerName: 'Brüt Kg', field: 'brutKg', width: 90, cellClass: '!p-0', type: 'rightAligned',
      cellRenderer: (p: { data: KalemRow; value: number; node: { rowIndex: number | null } }) => (
        <TurkishNumberInput
          value={p.value}
          disabled={p.data.irsaliyeKalemId != null}
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
          disabled={p.data.irsaliyeKalemId != null}
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
          disabled={p.data.irsaliyeKalemId != null}
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
          disabled={p.data.irsaliyeKalemId != null}
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
          disabled={p.data.irsaliyeKalemId != null}
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
          disabled={p.data.irsaliyeKalemId != null}
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
      headerName: 'Döviz', field: 'doviz', width: 80, cellClass: '!p-0',
      cellRenderer: (p: { data: KalemRow }) => (
        <Select
          size="small"
          value={p.data.doviz}
          onChange={(val) => updateKalem(p.data.key, { doviz: val })}
          variant="borderless"
          className="!w-full !h-full !text-[12px] kalem-select"
          popupMatchSelectWidth={false}
          options={[
            { value: 'TL', label: 'TL' },
            { value: 'USD', label: 'USD' },
            { value: 'EUR', label: 'EUR' },
          ]}
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
  ], [kalemler.length, faturaTipi])

  const focusNextCell = (currentColId: string, rowIndex: number) => {
    const editableCols = colDefs.map((c) => c.field as string).filter((f) => f && f !== 'key' && f !== 'malzemeAd' && f !== 'varyant1RenkAd' && f !== 'irsaliyeNo' && f !== 'satirTutari')
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

  const storageKey = 'faturaKarti_' + faturaTipi
  const kolonLayoutKey = useCallback(
    () => `kolon_layout_${kullanici?.id ?? 'anonim'}_${storageKey}`,
    [kullanici?.id, storageKey],
  )
  const [kolonChooserOpen, setKolonChooserOpen] = useState(false)
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return defaultHiddenColsFor()
    try {
      const raw = localStorage.getItem(`kolon_layout_${'anonim'}_${storageKey}`)
      if (!raw) return defaultHiddenColsFor()
      const kayitlar: KolonKaydi[] = JSON.parse(raw)
      return new Set(kayitlar.filter((k) => k.gizli).map((k) => k.kolonAdi))
    } catch { return defaultHiddenColsFor() }
  })

  const chooserCols = useMemo(
    () =>
      colDefs
        .map((c) => ({
          id: c.colId ?? c.field ?? '',
          label: c.headerName ?? '',
        }))
        .filter((c) => c.id && c.id !== 'key'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        }
        syncHiddenFromGrid()
      })
      .catch(() => {
        syncHiddenFromGrid()
      })
  }, [applyKolonKayitlari, syncHiddenFromGrid, storageKey, kolonLayoutKey])

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

  const contextMenuItems: MenuProps['items'] = [
    { key: 'satir-ekle', label: 'Satır Ekle', icon: <PlusOutlined />, onClick: addKalem },
    { key: 'irsaliye-ekle', label: 'İrsaliye Ekle...', icon: <LinkOutlined />, onClick: openIrsaliyeModal },
  ]

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

  const baglanabilirFiltreli = baglanabilir.filter(
    (d) =>
      !baglanabilirArama ||
      `${d.irsaliyeNo} ${d.cariHesap?.ad ?? ''} ${d.cariHesap?.kod ?? ''}`
        .toLocaleLowerCase('tr-TR')
        .includes(baglanabilirArama.toLocaleLowerCase('tr-TR')),
  )

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
              report: { label: 'Rapor', onClick: () => setRaporModalAcik(true), disabled: !id },
            })}
          />
        </div>
        <div className="!flex-1 !min-h-0 !flex !flex-col">
          <div className="!flex-shrink-0 !space-y-1.5">
            <div className="!flex !gap-2">
              <div className="!shrink-0 !border !border-gray-200 !rounded-sm !p-2">
                <div className="!text-[12px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-1">Genel Bilgiler</div>
                <div className="!space-y-0.5">
                  <div className="!flex !items-center !gap-3">
                    <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">Fatura No</div>
                    <Input size="small" value={faturaNo} className="!w-48 !text-[12px] !font-medium !text-[#f57c00]" readOnly />
                  </div>
                  <div className="!flex !items-center !gap-3">
                    <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">Fatura Tarihi</div>
                    <DatePicker size="small" value={faturaTarihi} onChange={(d) => d && setFaturaTarihi(d)} format="DD.MM.YYYY" placeholder="Fatura tarihi" className="!w-48 !text-[12px]" />
                  </div>
                  <div className="!flex !items-center !gap-3">
                    <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">Sevk Tarihi</div>
                    <DatePicker size="small" value={sevkTarihi} onChange={(d) => setSevkTarihi(d)} format="DD.MM.YYYY" placeholder="Sevk tarihi" className="!w-48 !text-[12px]" />
                  </div>
                  <div className="!flex !items-center !gap-3">
                    <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">Belge No</div>
                    <Input size="small" value={belgeNo} onChange={(e) => setBelgeNo(e.target.value)} className="!w-48 !text-[12px]" />
                  </div>
                  <div className="!flex !items-center !gap-3">
                    <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">Açıklama</div>
                    <Input size="small" value={aciklama} onChange={(e) => setAciklama(e.target.value)} className="!w-48 !text-[12px]" />
                  </div>
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
                  <div className="!flex !items-center !gap-3">
                    <div className="!text-[12px] !text-[#333] !w-24 !shrink-0">Yetkili</div>
                    <Input size="small" value={yetkili} onChange={(e) => setYetkili(e.target.value)} className="!w-48 !text-[11px]" />
                  </div>
                </div>
              </div>

              {bagliIrsaliyeler.length > 0 && (
              <div className="!shrink-0 !border !border-gray-200 !rounded-sm !p-2">
                <div className="!text-[12px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-1">Entegrasyon Bilgileri</div>
                <div className="!space-y-0.5">
                  <div className="!flex !items-start !gap-3">
                    <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">İrsaliye</div>
                    <div className="!flex !flex-wrap !gap-1">
                      {bagliIrsaliyeler.map((r) => (
                        <Tooltip key={r.id} title="İrsaliyeyi aç">
                          <Tag color="blue" onClick={() => onOpenIrsaliye?.({ id: r.id, irsaliyeTipi: r.irsaliyeTipi, irsaliyeNo: r.irsaliyeNo ?? '' })} className="!cursor-pointer !text-[12px] !mr-0">
                            {r.irsaliyeNo ?? '(nosuz)'}
                          </Tag>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              )}
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
                <Button size="small" type="dashed" icon={<LinkOutlined />} onClick={openIrsaliyeModal} className="!text-[12px]">
                  İrsaliye Ekle
                </Button>
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
        open={irsaliyeModal}
        onCancel={() => setIrsaliyeModal(false)}
        width="95vw"
        title={<span className="!text-[13px] !font-semibold">Bağlanabilir İrsaliyeler — kalemler kilitli aktarılır</span>}
        footer={[
          <Button key="vazgec" onClick={() => setIrsaliyeModal(false)} className="!text-[12px]">
            Vazgeç
          </Button>,
          <Button
            key="aktar"
            type="primary"
            onClick={confirmIrsaliyeEkle}
            className="!text-[12px]"
          >
            Seçilenleri Aktar
          </Button>,
        ]}
      >
        <div className="!flex !flex-col !gap-2">
          <Input
            size="small"
            placeholder="Fiş no veya cari ara..."
            allowClear
            value={baglanabilirArama}
            onChange={(e) => setBaglanabilirArama(e.target.value)}
            prefix={<SearchOutlined style={{ fontSize: 12, color: '#9ca3af' }} />}
            className="!w-80 !text-[12px]"
          />
          <div className="!text-[11px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
            İrsaliyeler ({baglanabilirFiltreli.length} fiş, seçip aktarın)
          </div>
          <div className="!max-h-[420px] !overflow-auto">
            {baglanabilirFiltreli.length === 0 && (
              <div className="!text-[12px] !text-[#9ca3af]">Bağlanabilir irsaliye yok (tamamı faturaya bağlı).</div>
            )}
            {baglanabilirFiltreli.map((i) => (
              <div key={i.id} className="!flex !items-center !gap-2 !py-1 !border-b !border-gray-100">
                <Checkbox
                  checked={seciliIrsaliyeler.includes(i.id)}
                  onChange={(e) =>
                    setSeciliIrsaliyeler((prev) =>
                      e.target.checked ? [...prev, i.id] : prev.filter((x) => x !== i.id),
                    )
                  }
                />
                <span className="!text-[12px] !font-medium !text-[#f57c00]">{i.irsaliyeTipi}-{i.irsaliyeNo || '(nosuz)'}</span>
                <span className="!text-[12px] !text-[#333]">{i.cariHesap?.ad ?? ''}</span>
                <span className="!text-[11px] !text-[#9ca3af] !ml-auto !tabular-nums">{(i.kalemler ?? []).length} kalem</span>
              </div>
            ))}
          </div>
        </div>
      </Modal>
      <RaporSecimModal
        open={raporModalAcik}
        ekranAdi={ekranAdi || 'fatura'}
        parametreler={id ? { id } : undefined}
        onCancel={() => setRaporModalAcik(false)}
      />
    </Spin>
  )
}
