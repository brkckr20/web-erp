'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Tabs, Input, Button, DatePicker, Select, Upload, App, Modal, Popconfirm, Tooltip, Spin } from 'antd'
import { DeleteOutlined, UploadOutlined, DownloadOutlined, PlusOutlined, PaperClipOutlined } from '@ant-design/icons'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community'
import type { ColDef, GridApi, CellFocusedEvent } from 'ag-grid-community'
import dayjs from 'dayjs'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import SearchableCariSelect from '@/components/shared/SearchableCariSelect'
import SearchableMalzemeSelect from '@/components/shared/SearchableMalzemeSelect'
import { fiyatTeklifApi, type FiyatTeklif, type FiyatTeklifDosya, type FiyatTeklifKalem } from '@/lib/fiyat-teklif-api'
import { dovizApi, type DovizKuruSatir } from '@/lib/doviz-api'
import { agGridLocaleTR } from '@/lib/ag-grid-locale'
import { useKirli } from '@/lib/kirli'
import { useAuth } from '@/context/AuthContext'

ModuleRegistry.registerModules([AllCommunityModule])

// Malzeme Yönetim Fişi ile aynı tablo görünümü.
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

interface Satir {
  key: string
  malzemeKod: string
  malzemeAd: string
  miktar: number
  birim: string
  birimFiyat: number
  dovizCinsi: string
  dovizKuru: number
}

const formatTR = (v: number) => {
  if (v === 0) return ''
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
}

const parseTR = (s: string) => {
  if (!s) return 0
  return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
}

function TurkishNumberInput({
  value,
  onChange,
  className,
  onEnter,
  disabled,
}: {
  value: number
  onChange: (v: number) => void
  className?: string
  onEnter?: () => void
  disabled?: boolean
}) {
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState('')
  const display = focused ? draft : formatTR(value)

  return (
    <Input
      size="small"
      type="text"
      value={display}
      disabled={disabled}
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

// Metin hücresi: yazarken local state, blur/Enter'da parent'a commit.
function CellTextInput({
  value,
  onCommit,
  onEnter,
  className,
  textAlign = 'left',
}: {
  value: string
  onCommit: (v: string) => void
  onEnter?: () => void
  className?: string
  textAlign?: 'left' | 'right'
}) {
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState('')
  const display = focused ? draft : value

  return (
    <Input
      size="small"
      value={display}
      style={{ textAlign }}
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

const formatBoyut = (b: number | null) => {
  if (b == null) return ''
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

const formatTutar = (n: number) =>
  n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const satirTutarTL = (s: Satir) => {
  const brut = (s.miktar || 0) * (s.birimFiyat || 0)
  if (s.dovizCinsi === 'TL') return brut
  return brut * (s.dovizKuru || 1)
}

const bosSatir = (key: string): Satir => ({
  key,
  malzemeKod: '',
  malzemeAd: '',
  miktar: 0,
  birim: 'ADET',
  birimFiyat: 0,
  dovizCinsi: 'TL',
  dovizKuru: 1,
})

const kalemToSatir = (k: FiyatTeklifKalem, key: string): Satir => ({
  key,
  malzemeKod: k.malzemeKod,
  malzemeAd: k.malzemeAd ?? '',
  miktar: Number(k.miktar) || 0,
  birim: k.birim || 'ADET',
  birimFiyat: Number(k.birimFiyat) || 0,
  dovizCinsi: k.dovizCinsi || 'TL',
  dovizKuru: k.dovizKuru == null ? 1 : Number(k.dovizKuru),
})

const ODAKLANABILIR_KOLONLAR = ['malzemeKod', 'miktar', 'birim', 'birimFiyat', 'doviz', 'dovizKuru']

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

interface Props {
  id?: number
  onClose: () => void
  onKaydet?: (yeniId: number) => void
  onKirliChange?: (kirli: boolean) => void
}

export default function SatinalmaFiyatTeklifKarti({ id, onClose, onKaydet, onKirliChange }: Props) {
  const { message, modal } = App.useApp()
  const { kullanici } = useAuth()

  const [loading, setLoading] = useState(Boolean(id))
  const [kaydediyor, setKaydediyor] = useState(false)
  const [teklif, setTeklif] = useState<FiyatTeklif | null>(null)

  const [teklifNo, setTeklifNo] = useState('')
  const [tarih, setTarih] = useState<dayjs.Dayjs>(dayjs())
  const [gecerlilik, setGecerlilik] = useState<dayjs.Dayjs | null>(null)
  const [cariKod, setCariKod] = useState('')
  const [cariAd, setCariAd] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [satirlar, setSatirlar] = useState<Satir[]>([])

  const keyRef = useRef(1)
  const yeniKey = () => `s${keyRef.current++}`
  const gridApiRef = useRef<GridApi<Satir> | null>(null)

  const { kirli, temizle } = useKirli([teklifNo, tarih, gecerlilik, cariKod, cariAd, aciklama, satirlar])
  useEffect(() => { onKirliChange?.(kirli) }, [kirli, onKirliChange])

  const [dovizSecenekleri, setDovizSecenekleri] = useState<string[]>(['TL', 'USD', 'EUR', 'GBP'])
  const [kurlar, setKurlar] = useState<DovizKuruSatir[]>([])

  useEffect(() => {
    dovizApi.getSonKurlar().then(setKurlar).catch(() => {})
    dovizApi
      .list()
      .then((d) => {
        const kodlar = d.map((x) => x.kod).filter((k) => k && k !== 'TL')
        setDovizSecenekleri(['TL', ...Array.from(new Set(kodlar))])
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (id) {
      setLoading(true)
      fiyatTeklifApi
        .get(id)
        .then((t) => {
          setTeklif(t)
          setTeklifNo(t.teklifNo)
          setTarih(t.tarih ? dayjs(t.tarih) : dayjs())
          setGecerlilik(t.gecerlilikTarihi ? dayjs(t.gecerlilikTarihi) : null)
          setCariKod(t.cariKod)
          setCariAd(t.cariAd ?? '')
          setAciklama(t.aciklama ?? '')
          setSatirlar((t.kalemler ?? []).map((k, i) => kalemToSatir(k, `k${i}`)))
        })
        .catch(() => message.error('Fiyat teklifi yüklenemedi'))
        .finally(() => {
          setLoading(false)
          temizle()
        })
    } else {
      fiyatTeklifApi
        .nextNo()
        .then((r) => {
          setTeklifNo(r.teklifNo)
          temizle()
        })
        .catch(() => {})
      setSatirlar([bosSatir(yeniKey())])
      temizle()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const guncelle = useCallback((key: string, patch: Partial<Satir>) => {
    setSatirlar((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)))
  }, [])

  const satirSil = useCallback((key: string) => setSatirlar((prev) => prev.filter((s) => s.key !== key)), [])

  const dovizDegistir = useCallback((key: string, doviz: string) => {
    const kur = doviz === 'TL' ? 1 : kurlar.find((k) => k.dovizKodu === doviz)?.satisKuru ?? 0
    guncelle(key, { dovizCinsi: doviz, dovizKuru: kur })
  }, [kurlar, guncelle])

  const toplamTL = useMemo(
    () => satirlar.reduce((acc, s) => acc + satirTutarTL(s), 0),
    [satirlar],
  )

  const odaklanabilir = (colId?: string) => !!colId && ODAKLANABILIR_KOLONLAR.includes(colId)

  const focusNextCell = useCallback((currentColId: string, rowIndex: number) => {
    const idx = ODAKLANABILIR_KOLONLAR.indexOf(currentColId)
    if (idx === -1) return
    if (idx < ODAKLANABILIR_KOLONLAR.length - 1) {
      const nextCol = ODAKLANABILIR_KOLONLAR[idx + 1]
      gridApiRef.current?.setFocusedCell(rowIndex, nextCol)
      focusCellEditor(nextCol, rowIndex)
    } else {
      const firstCol = ODAKLANABILIR_KOLONLAR[0]
      const nextRow = rowIndex + 1
      const rowCount = gridApiRef.current?.getDisplayedRowCount() ?? 0
      if (nextRow < rowCount) {
        gridApiRef.current?.setFocusedCell(nextRow, firstCol)
        focusCellEditor(firstCol, nextRow)
      }
    }
  }, [])

  const addKalem = () => {
    const yeni = bosSatir(yeniKey())
    const newIndex = satirlar.length
    setSatirlar((prev) => [...prev, yeni])
    setTimeout(() => {
      gridApiRef.current?.setFocusedCell(newIndex, 'malzemeKod')
      focusCellEditor('malzemeKod', newIndex)
    }, 60)
  }

  const handleKaydet = async () => {
    if (!cariKod) {
      message.warning('Cari seçilmelidir')
      return
    }
    const gecerli = satirlar.filter((s) => s.malzemeKod && (s.miktar ?? 0) > 0)
    if (gecerli.length === 0) {
      message.warning('En az bir malzeme kalemi girilmelidir')
      return
    }
    const atilan = satirlar.length - gecerli.length

    const payload = {
      tarih: tarih.format('YYYY-MM-DD'),
      gecerlilikTarihi: gecerlilik ? gecerlilik.format('YYYY-MM-DD') : null,
      cariKod,
      cariAd: cariAd || undefined,
      aciklama: aciklama || undefined,
      olusturanKullanici: kullanici?.id ?? null,
      kalemler: gecerli.map((s) => ({
        malzemeKod: s.malzemeKod,
        malzemeAd: s.malzemeAd || undefined,
        miktar: s.miktar,
        birim: s.birim || 'ADET',
        birimFiyat: s.birimFiyat,
        dovizCinsi: s.dovizCinsi || 'TL',
        dovizKuru: s.dovizCinsi === 'TL' ? null : s.dovizKuru,
      })),
    }

    setKaydediyor(true)
    try {
      if (id) {
        const guncel = await fiyatTeklifApi.update(id, payload)
        setTeklif(guncel)
        setSatirlar((guncel.kalemler ?? []).map((k, i) => kalemToSatir(k, `k${i}`)))
        message.success('Fiyat teklifi güncellendi')
        if (atilan > 0) message.warning(`${atilan} satır malzeme/miktar eksik olduğu için kaydedilmedi`)
        temizle()
      } else {
        const olusan = await fiyatTeklifApi.create(payload)
        message.success('Fiyat teklifi oluşturuldu')
        if (atilan > 0) message.warning(`${atilan} satır malzeme/miktar eksik olduğu için kaydedilmedi`)
        onKaydet?.(olusan.id)
      }
    } catch {
      message.error('Kaydetme hatası')
    } finally {
      setKaydediyor(false)
    }
  }

  const handleSil = () => {
    if (!id) return
    modal.confirm({
      title: 'Fiyat Teklifini Sil',
      content: `${teklifNo} numaralı fiyat teklifini silmek istediğinize emin misiniz?`,
      okText: 'Evet, sil',
      okButtonProps: { danger: true },
      cancelText: 'Vazgeç',
      onOk: async () => {
        try {
          await fiyatTeklifApi.remove(id)
          message.success('Fiyat teklifi silindi')
          onClose()
        } catch {
          message.error('Silme hatası')
        }
      },
    })
  }

  const [dosyaYukleniyor, setDosyaYukleniyor] = useState(false)
  const [onizlemeDosya, setOnizlemeDosya] = useState<FiyatTeklifDosya | null>(null)

  const handleDosyaYukle = async (file: File) => {
    if (!id) return
    setDosyaYukleniyor(true)
    try {
      await fiyatTeklifApi.addDosya(id, file)
      const t = await fiyatTeklifApi.get(id)
      setTeklif(t)
      message.success('Dosya yüklendi')
    } catch {
      message.error('Dosya yüklenemedi')
    } finally {
      setDosyaYukleniyor(false)
    }
  }

  const handleDosyaSil = async (dosyaId: number) => {
    if (!id) return
    try {
      await fiyatTeklifApi.removeDosya(dosyaId)
      const t = await fiyatTeklifApi.get(id)
      setTeklif(t)
      message.success('Dosya silindi')
    } catch {
      message.error('Dosya silinemedi')
    }
  }

  const onizlemeMimetype = onizlemeDosya?.mimetype ?? ''
  const onizlemeUrl = onizlemeDosya ? fiyatTeklifApi.getDosyaUrl(onizlemeDosya.id) : '#'

  const toolbarButtons = createToolbarButtons(
    {
      onSave: handleKaydet,
      onDelete: id ? handleSil : undefined,
    },
    {
      save: { accent: kirli, disabled: loading || kaydediyor },
      delete: { disabled: loading || kaydediyor },
    },
  )

  const kalemColDefs = useMemo<ColDef<Satir>[]>(() => [
    {
      headerName: '', field: 'key', width: 40, minWidth: 40, maxWidth: 40,
      resizable: false, sortable: false, filter: false, cellClass: '!p-0',
      cellRenderer: (p: { data: Satir }) => (
        <div className="!flex !items-center !justify-center !h-full !w-full">
          <Popconfirm
            title="Satırı sil"
            description="Bu satırı silmek istediğinize emin misiniz?"
            okText="Evet, sil"
            cancelText="Vazgeç"
            okButtonProps={{ danger: true, size: 'small' }}
            cancelButtonProps={{ size: 'small' }}
            placement="right"
            onConfirm={() => satirSil(p.data.key)}
          >
            <Tooltip title="Satır Sil">
              <Button type="text" danger size="small" icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
    {
      headerName: 'Malzeme', field: 'malzemeKod', width: 300, cellClass: '!p-0',
      cellRenderer: (p: { data: Satir; node: { rowIndex: number | null } }) => (
        <SearchableMalzemeSelect
          value={p.data.malzemeKod}
          widthClass="!w-full"
          className="!w-full !h-full !text-[12px] kalem-select"
          onChange={(kod, rec) => {
            guncelle(p.data.key, { malzemeKod: kod, malzemeAd: rec?.ad ?? '' })
            if (kod && p.node.rowIndex != null) focusNextCell('malzemeKod', p.node.rowIndex)
          }}
        />
      ),
    },
    {
      headerName: 'Miktar', field: 'miktar', width: 90, cellClass: '!p-0', type: 'rightAligned',
      cellRenderer: (p: { data: Satir; value: number; node: { rowIndex: number | null } }) => (
        <TurkishNumberInput
          value={p.value}
          onChange={(val) => guncelle(p.data.key, { miktar: val })}
          onEnter={() => p.node.rowIndex != null && focusNextCell('miktar', p.node.rowIndex)}
          className="!w-full !h-full !text-[12px] kalem-input"
        />
      ),
    },
    {
      headerName: 'Birim', field: 'birim', width: 80, cellClass: '!p-0',
      cellRenderer: (p: { data: Satir; value: string; node: { rowIndex: number | null } }) => (
        <CellTextInput
          value={p.value ?? ''}
          onCommit={(val) => guncelle(p.data.key, { birim: val })}
          onEnter={() => p.node.rowIndex != null && focusNextCell('birim', p.node.rowIndex)}
          className="!w-full !h-full !text-[12px] kalem-input"
        />
      ),
    },
    {
      headerName: 'Birim Fiyat', field: 'birimFiyat', width: 100, cellClass: '!p-0', type: 'rightAligned',
      cellRenderer: (p: { data: Satir; value: number; node: { rowIndex: number | null } }) => (
        <TurkishNumberInput
          value={p.value}
          onChange={(val) => guncelle(p.data.key, { birimFiyat: val })}
          onEnter={() => p.node.rowIndex != null && focusNextCell('birimFiyat', p.node.rowIndex)}
          className="!w-full !h-full !text-[12px] kalem-input"
        />
      ),
    },
    {
      headerName: 'Döviz', field: 'dovizCinsi', colId: 'doviz', width: 80, cellClass: '!p-0',
      cellRenderer: (p: { data: Satir; node: { rowIndex: number | null } }) => (
        <Select
          size="small"
          value={p.data.dovizCinsi}
          onChange={(val) => {
            dovizDegistir(p.data.key, val)
            if (p.node.rowIndex != null) focusNextCell('doviz', p.node.rowIndex)
          }}
          variant="borderless"
          className="!w-full !h-full !text-[12px] kalem-select"
          popupMatchSelectWidth={false}
          options={dovizSecenekleri.map((k) => ({ value: k, label: k }))}
        />
      ),
    },
    {
      headerName: 'Kur', field: 'dovizKuru', width: 90, cellClass: '!p-0', type: 'rightAligned',
      cellRenderer: (p: { data: Satir; value: number; node: { rowIndex: number | null } }) => (
        <TurkishNumberInput
          value={p.value}
          disabled={p.data.dovizCinsi === 'TL'}
          onChange={(val) => guncelle(p.data.key, { dovizKuru: val })}
          onEnter={() => p.node.rowIndex != null && focusNextCell('dovizKuru', p.node.rowIndex)}
          className="!w-full !h-full !text-[12px] kalem-input"
        />
      ),
    },
    {
      headerName: 'Tutar', colId: 'tutar', width: 110, type: 'rightAligned',
      valueGetter: (p) => (p.data ? satirTutarTL(p.data) : 0),
      valueFormatter: (p) => formatTutar(Number(p.value) || 0),
    },
  ], [dovizSecenekleri, guncelle, satirSil, dovizDegistir, focusNextCell])

  const kalemGridDefaultColDef = useMemo(() => ({
    resizable: true,
    sortable: false,
    filter: false,
  }), [])

  return (
    <Spin spinning={loading} classNames={{ root: 'stok-hareket-fisi-karti !h-full [&_.ant-spin-container]:!h-full' }}>
      <div className="!px-3 !flex !flex-col !h-full !min-h-0 !overflow-hidden">
        <div className="!flex-shrink-0" style={{ marginLeft: -12, marginRight: -12 }}>
          <CardToolbar buttons={toolbarButtons} />
        </div>

        <div className="!flex-1 !min-h-0 !flex !flex-col">
          <Tabs
            defaultActiveKey="genel"
            size="small"
            tabBarGutter={2}
            className="!flex-1 !flex !flex-col !min-h-0 !overflow-hidden [&_.ant-tabs-content-holder]:!flex [&_.ant-tabs-content-holder]:!flex-col [&_.ant-tabs-content-holder]:!flex-1 [&_.ant-tabs-content-holder]:!min-h-0 [&_.ant-tabs-content-holder]:!overflow-hidden [&_.ant-tabs-content]:!flex-1 [&_.ant-tabs-content]:!min-h-0 [&_.ant-tabs-content]:!overflow-hidden [&_.ant-tabs-tabpane]:!h-full [&_.ant-tabs-tabpane]:!overflow-hidden [&_.ant-tabs-nav]:!mb-2 [&_.ant-tabs-nav]:!border-b [&_.ant-tabs-nav]:!border-gray-200 [&_.ant-tabs-nav]:!flex-shrink-0 [&_.ant-tabs-tab]:!text-[12px] [&_.ant-tabs-tab]:!px-2 [&_.ant-tabs-tab]:!py-1 [&_.ant-tabs-tab]:!bg-[#E0E0E0] [&_.ant-tabs-tab]:!border [&_.ant-tabs-tab]:!border-gray-200 [&_.ant-tabs-tab]:!text-[#333] [&_.ant-tabs-tab-active]:!bg-white [&_.ant-tabs-tab-active]:!border-t-2 [&_.ant-tabs-tab-active]:!border-t-[#FF9933] [&_.ant-tabs-tab-active]:!text-[#FF9933] [&_.ant-tabs-ink-bar]:!hidden"
            items={[
              {
                key: 'genel',
                label: 'Genel',
                children: (
                  <div className="!flex !flex-col !h-full">
                    <div className="!flex-shrink-0 !space-y-1.5">
                      <div className="!flex !gap-2">
                        <div className="!shrink-0 !border !border-gray-200 !rounded-sm !p-2">
                          <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-1">Genel Bilgiler</div>
                          <div className="!space-y-0.5">
                            <div className="!flex !items-center !gap-3">
                              <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">Teklif No</div>
                              <Input size="small" value={teklifNo} className="!w-48 !text-[12px]" readOnly />
                            </div>
                            <div className="!flex !items-center !gap-3">
                              <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">Tarih</div>
                              <DatePicker size="small" value={tarih} onChange={(d) => d && setTarih(d)} format="DD.MM.YYYY" className="!w-48 !text-[12px]" />
                            </div>
                            <div className="!flex !items-center !gap-3">
                              <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">Geçerlilik Tarihi</div>
                              <DatePicker size="small" value={gecerlilik} onChange={(d) => setGecerlilik(d)} format="DD.MM.YYYY" placeholder="Seçiniz" className="!w-48 !text-[12px]" allowClear />
                            </div>
                            <div className="!flex !items-center !gap-3">
                              <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">Açıklama</div>
                              <Input
                                size="small"
                                value={aciklama}
                                onChange={(e) => setAciklama(e.target.value)}
                                className="!w-48 !text-[12px]"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="!flex-1 !border !border-gray-200 !rounded-sm !p-2">
                          <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-1">Cari Hesap Bilgileri</div>
                          <div className="!space-y-0.5">
                            <div className="!flex !items-center !gap-3">
                              <div className="!text-[12px] !text-[red] !w-24 !shrink-0">Cari Hesap</div>
                              <SearchableCariSelect
                                value={cariKod}
                                onChange={(kod, rec) => {
                                  setCariKod(kod)
                                  setCariAd(rec?.ad ?? '')
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="!border !border-gray-200 !rounded-sm !flex-1 !min-h-0 !flex !flex-col !mt-1.5">
                      <div className="!flex !items-center !justify-between !px-3 !pt-2 !pb-1 !flex-shrink-0">
                        <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide">Malzemeler</div>
                        <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={addKalem} className="!text-[12px]">
                          Satır Ekle
                        </Button>
                      </div>
                      <div className="kalemler-grid !flex-1 !min-h-0">
                        <AgGridReact
                          rowData={satirlar}
                          columnDefs={kalemColDefs}
                          theme={antTheme}
                          headerHeight={32}
                          rowHeight={30}
                          rowSelection={{ mode: 'singleRow', enableClickSelection: true }}
                          getRowId={(p) => p.data.key}
                          localeText={agGridLocaleTR}
                          defaultColDef={kalemGridDefaultColDef}
                          onGridReady={(e) => {
                            gridApiRef.current = e.api
                          }}
                          tabToNextCell={(params) => {
                            const prev = params.previousCellPosition
                            if (!prev) return params.nextCellPosition ?? false
                            const curCol = prev.column.getColId()
                            const curIdx = odaklanabilirKolonlar.indexOf(curCol)
                            if (curIdx === -1) return params.nextCellPosition ?? false
                            let colIdx = curIdx
                            let rowIndex = prev.rowIndex
                            if (params.backwards) {
                              colIdx -= 1
                              if (colIdx < 0) { colIdx = odaklanabilirKolonlar.length - 1; rowIndex -= 1 }
                            } else {
                              colIdx += 1
                              if (colIdx > odaklanabilirKolonlar.length - 1) { colIdx = 0; rowIndex += 1 }
                            }
                            if (rowIndex < 0 || rowIndex >= satirlar.length) return prev
                            const col = gridApiRef.current?.getColumn(odaklanabilirKolonlar[colIdx])
                            if (!col) return prev
                            return { rowIndex, column: col, rowPinned: null }
                          }}
                          onCellFocused={(e: CellFocusedEvent) => {
                            const colId = typeof e.column === 'object' && e.column ? e.column.getColId() : undefined
                            if (colId && e.rowIndex != null && odaklanabilir(colId)) {
                              focusCellEditor(colId, e.rowIndex)
                            }
                          }}
                        />
                      </div>
                      <div className="!flex !items-center !justify-between !px-3 !py-2 !border-t !border-gray-100 !flex-shrink-0">
                        <div className="!flex !items-center !gap-4">
                          <span className="!text-[11px] !font-bold !text-[#6b7280] !uppercase !tracking-wide">Toplamlar</span>
                          <div className="!flex !items-center !gap-3 !text-[12px] !text-[#333]">
                            <span>
                              Kalem: <span className="!font-semibold !tabular-nums">{satirlar.length}</span>
                            </span>
                          </div>
                        </div>
                        <div className="!text-[12px] !font-semibold !text-[#333]">
                          Genel Toplam (TL karşılığı): <span className="!text-[#FF9933] !tabular-nums">{formatTutar(toplamTL)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'ekler',
                label: 'Ekler',
                children: (
                  <div className="!p-2 !h-full !overflow-auto">
                    <div className="!border !border-gray-200 !rounded-sm !p-2 !max-w-[860px]">
                      <div className="!flex !items-center !justify-between !mb-1">
                        <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide">
                          <PaperClipOutlined className="!mr-1" /> Dosyalar
                        </div>
                        <Upload
                          showUploadList={false}
                          disabled={!id || dosyaYukleniyor}
                          customRequest={async ({ file }) => handleDosyaYukle(file as File)}
                        >
                          <Button
                            size="small"
                            icon={<UploadOutlined />}
                            loading={dosyaYukleniyor}
                            disabled={!id}
                            title={!id ? 'Önce teklifi kaydedin' : 'Dosya yükle'}
                          >
                            Dosya Ekle
                          </Button>
                        </Upload>
                      </div>
                      <div className="!space-y-1">
                        {(teklif?.dosyalar ?? []).length === 0 && (
                          <div className="!text-[11px] !text-gray-400">
                            {id ? 'Henüz dosya eklenmemiş' : 'Dosya eklemek için önce teklifi kaydedin'}
                          </div>
                        )}
                        {(teklif?.dosyalar ?? []).map((d) => (
                          <div key={d.id} className="!flex !items-center !justify-between !gap-2 !text-[11px] !bg-gray-50 !rounded-sm !px-2 !py-1">
                            <button
                              type="button"
                              onClick={() => setOnizlemeDosya(d)}
                              className="!flex !items-center !gap-1 !text-blue-600 !min-w-0 !bg-transparent !border-0 !p-0 !cursor-pointer"
                              title="Önizle"
                            >
                              <PaperClipOutlined className="!shrink-0" />
                              <span className="!truncate">{d.dosyaAdi}</span>
                              {d.boyut != null && <span className="!text-gray-400 !shrink-0">({formatBoyut(d.boyut)})</span>}
                            </button>
                            <div className="!flex !items-center !shrink-0">
                              <a href={fiyatTeklifApi.getDosyaUrl(d.id)} target="_blank" rel="noreferrer" className="!flex !items-center !px-1.5 !text-blue-600" title="İndir">
                                <DownloadOutlined />
                              </a>
                              <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => handleDosyaSil(d.id)} title="Sil" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>

        <Modal
          open={!!onizlemeDosya}
          title={onizlemeDosya?.dosyaAdi}
          footer={[
            <Button key="indir">
              <a href={onizlemeUrl} target="_blank" rel="noreferrer">İndir / Tam Boyut</a>
            </Button>,
            <Button key="kapat" type="primary" onClick={() => setOnizlemeDosya(null)}>Kapat</Button>,
          ]}
          onCancel={() => setOnizlemeDosya(null)}
          width={1200}
          centered
          destroyOnHidden
        >
          {onizlemeDosya && onizlemeMimetype.startsWith('image/') && (
            <img src={onizlemeUrl} alt={onizlemeDosya.dosyaAdi} className="!max-w-full !max-h-[80vh] !object-contain !mx-auto" />
          )}
          {onizlemeDosya && onizlemeMimetype === 'application/pdf' && (
            <iframe src={onizlemeUrl} title={onizlemeDosya.dosyaAdi} className="!w-full" style={{ height: '78vh', border: 0 }} />
          )}
          {onizlemeDosya && !onizlemeMimetype.startsWith('image/') && onizlemeMimetype !== 'application/pdf' && (
            <div className="!text-[12px] !text-gray-500 !py-6 !text-center">
              Bu dosya türü önizlenemiyor. İndirmek için yukarıdaki bağlantıyı kullanın.
            </div>
          )}
        </Modal>
      </div>
    </Spin>
  )
}
