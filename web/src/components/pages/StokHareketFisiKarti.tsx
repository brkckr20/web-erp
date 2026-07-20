'use client'

import { Tabs, Input, Select, DatePicker, Button, App, Tooltip, Popconfirm, Spin, Modal } from 'antd'
import { useState, useEffect, useMemo, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community'
import type { ColDef, GridApi, CellFocusedEvent } from 'ag-grid-community'
import dayjs from 'dayjs'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import SearchableCariSelect from '@/components/shared/SearchableCariSelect'
import SearchableDepoSelect from '@/components/shared/SearchableDepoSelect'
import SearchableMalzemeSelect from '@/components/shared/SearchableMalzemeSelect'
import RaporSecimModal from '@/components/shared/RaporSecimModal'
import { stokHareketFisiApi } from '@/lib/stok-hareket-fisi-api'
import { malzemeApi, type Malzeme } from '@/lib/malzeme-api'
import { stokHareketFisiOnizle, stokHareketFisiPdfAl, stokHareketFisiTasarimlari, type FisRaporData } from '@/lib/reports/stok-hareket-fisi.report'
import { agGridLocaleTR } from '@/lib/ag-grid-locale'
import { useAuth } from '@/context/AuthContext'

ModuleRegistry.registerModules([AllCommunityModule])

// Ant Design tablosuna benzer görünüm
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
  // Hücreye tıklayınca çıkan mavi focus çerçevesini kaldır
  rangeSelectionBorderColor: 'transparent',
})

interface FisKartiProps {
  fisTipi?: string
  id?: number
  onDeleted?: (fisTipi: string) => void
}

interface KalemRow {
  key: string
  tip: string
  malzemeKod: string
  malzemeAd: string
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

const fisTipiMap: Record<string, string> = {
  '10': '10-Üretim Fişi',
  '16': '16-Sayım Fişi',
  '17': '17-Depo Transfer Fişi',
  '18': '18-Özel Fiş (Giriş)',
  '20': '20-Karma Koli Üretim',
  '21': '21-Karma Koli Sarf Bozma',
  '40': '40-Üretimden İade',
  '99': '99-Sayım Farkı Noksanı',
  '101': '101-Sayım Farkı Fazlası',
  '130': '130-Sarf Fişi',
  '131': '131-Fire Fişi',
  '132': '132-Özel Fiş (Çıkış)',
  '135': '135-Transfer Çıkış',
  '136': '136-Karma Koli Sarf',
  '137': '137-Karma Koli Bozma',
  '140': '140-Üretime Çıkış Fişi',
}

const formatTR = (v: number) => {
  if (v === 0) return ''
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
}

const parseTR = (s: string) => {
  if (!s) return 0
  return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
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

// Metin hücresi: yazarken local state, blur/Enter'da parent'a commit (re-render kaynaklı imleç kaybını önler)
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

export default function StokHareketFisiKarti({ fisTipi = '10', id, onDeleted }: FisKartiProps) {
  const { message } = App.useApp()
  const { modal } = App.useApp()
  const { kullanici } = useAuth()
  const kayitYapan = kullanici ? `${kullanici.kod} - ${kullanici.ad}` : null
  const fisTipiLabel = fisTipiMap[fisTipi] || fisTipi
  const [fisNo, setFisNo] = useState('')
  const [cariKod, setCariKod] = useState<string>('')
  const [depoKod, setDepoKod] = useState<string>('')
  const [fisTarihi, setFisTarihi] = useState(dayjs())
  const [sevkTarihi, setSevkTarihi] = useState(dayjs())
  const [belgeNo, setBelgeNo] = useState('')
  const [kalemler, setKalemler] = useState<KalemRow[]>([emptyKalem()])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [raporModalAcik, setRaporModalAcik] = useState(false)

  useEffect(() => {
    if (id) {
      setLoading(true)
      stokHareketFisiApi
        .get(id)
        .then((f) => {
          setFisNo(f.fisNo)
          if (f.fisTarihi) setFisTarihi(dayjs(f.fisTarihi))
          if (f.sevkTarihi) setSevkTarihi(dayjs(f.sevkTarihi))
          setBelgeNo(f.belgeAdi ?? '')
          setCariKod((f as any).cariHesap?.kod ?? String(f.cariHesapId ?? ''))
          setDepoKod((f as any).depo?.kod ?? String(f.depoId ?? ''))
          const rows: KalemRow[] = (f.kalemler ?? []).map((k) => ({
            key: Math.random().toString(36).slice(2),
            tip: 'Malzeme',
            malzemeKod: (k as any).malzeme?.kod ?? (k.malzemeId != null ? String(k.malzemeId) : ''),
            malzemeAd: (k as any).malzeme?.ad ?? '',
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
          }))
          setKalemler(rows.length > 0 ? rows : [emptyKalem()])
        })
        .catch((err) => message.error('Fiş yüklenemedi: ' + (err?.message || err)))
        .finally(() => setLoading(false))
    } else {
      stokHareketFisiApi
        .nextFisNo(fisTipi)
        .then((res) => setFisNo(res.fisNo))
        .catch(() => setFisNo('00000001'))
    }
  }, [id, fisTipi])

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
        const hesapMiktari = hesapMiktariGetir(next)
        const matrah = hesapMiktari * (next.birimFiyat || 0)
        next.satirTutari = matrah + matrah * (next.kdv || 0) / 100
        return next
      }),
    )
  }

  const addKalem = () => setKalemler((prev) => [...prev, emptyKalem()])
  const removeKalem = (key: string) =>
    setKalemler((prev) => {
      // Birden fazla satır varsa sil; tek satır kaldıysa içeriğini sıfırla (key'i koru)
      if (prev.length > 1) return prev.filter((k) => k.key !== key)
      return prev.map((k) => (k.key === key ? { ...emptyKalem(), key: k.key } : k))
    })

  // Yeni satır ekle ve yeni satırın Malzeme Kodu hücresine odaklan
  const addKalemAndFocusMalzeme = () => {
    let newIndex = 0
    setKalemler((prev) => {
      newIndex = prev.length
      return [...prev, emptyKalem()]
    })
    // Yeni satır DOM'a gelene kadar bekleyip odakla
    setTimeout(() => focusCellEditor('malzemeKod', newIndex), 50)
  }

  const handleKaydet = async () => {
    if (!cariKod) {
      message.warning('Cari hesap zorunludur')
      return
    }
    if (!depoKod) {
      message.warning('Depo zorunludur')
      return
    }
    const gecerliKalemler = kalemler.filter((k) => k.malzemeKod)
    if (gecerliKalemler.length === 0) {
      message.warning('En az bir malzeme kalemi girilmelidir')
      return
    }

    setSaving(true)
    try {
      const cariList = await cariHesapIdBul(cariKod)
      const depoList = await depoIdBul(depoKod)
      const kalemPayload = await Promise.all(
        gecerliKalemler.map(async (k) => {
          const malzeme = await malzemeApi.list().then((l) => l.find((m) => m.kod === k.malzemeKod))
          return {
            malzemeId: malzeme?.id ?? null,
            brutAgirlik: k.brutKg,
            netAgirlik: k.kg,
            brutMetre: k.brutMt,
            netMetre: k.mt,
            adet: k.adet,
            olcuBirimi: k.hesapBirimi || null,
            birimFiyat: k.birimFiyat,
            doviz: k.doviz || null,
            kdv: k.kdv || null,
            satirTutari: k.satirTutari,
            aciklama: k.aciklama || null,
          }
        }),
      )

      if (id) {
        await stokHareketFisiApi.update(id, {
          fisTarihi: fisTarihi.format('YYYY-MM-DD'),
          sevkTarihi: sevkTarihi.format('YYYY-MM-DD'),
          belgeAdi: belgeNo || null,
          cariHesapId: cariList,
          depoId: depoList,
          kayitYapan,
          kalemler: kalemPayload,
        } as any)
        message.success('Fiş güncellendi')
      } else {
        await stokHareketFisiApi.create({
          fisNo,
          fisTipi,
          fisTarihi: fisTarihi.format('YYYY-MM-DD'),
          sevkTarihi: sevkTarihi.format('YYYY-MM-DD'),
          belgeAdi: belgeNo || null,
          cariHesapId: cariList,
          depoId: depoList,
          kayitYapan,
          kalemler: kalemPayload,
        } as any)
        message.success('Fiş ve kalemler kaydedildi')
      }
    } catch (err: any) {
      message.error('Hata: ' + (err?.message || err))
    } finally {
      setSaving(false)
    }
  }

  const raporVerisiUret = (): FisRaporData => ({
    fisTipi: fisTipiLabel,
    fisNo,
    fisTarihi: fisTarihi.format('YYYY-MM-DD'),
    sevkTarihi: sevkTarihi.format('YYYY-MM-DD'),
    belgeNo,
    cariHesap: cariKod || undefined,
    depo: depoKod || undefined,
    kayitYapan: kayitYapan ?? undefined,
    kalemler: kalemler
      .filter((k) => k.malzemeKod)
      .map((k) => ({
        malzemeKod: k.malzemeKod,
        malzemeAd: k.malzemeAd,
        kg: k.kg,
        birimFiyat: k.birimFiyat,
        doviz: k.doviz,
        kdv: k.kdv,
        satirTutari: k.satirTutari,
        aciklama: k.aciklama,
      })),
    toplamMatrah,
    toplamKdv,
    toplam,
  })

  const handleRapor = () => {
    setRaporModalAcik(true)
  }

  const handleRaporOnizle = async (tasarimId: string) => {
    await stokHareketFisiOnizle(raporVerisiUret(), tasarimId)
  }

  const handleRaporIndir = async (tasarimId: string) => {
    await stokHareketFisiPdfAl(raporVerisiUret(), tasarimId)
  }

  const handleSil = () => {
    if (!id) {
      message.warning('Önce kaydedilmiş bir fiş olmalı')
      return
    }
    modal.confirm({
      title: 'Fişi Sil',
      content: `${fisTipiLabel} - ${fisNo} fişini silmek istediğinize emin misiniz?`,
      okText: 'Evet, sil',
      okButtonProps: { danger: true },
      cancelText: 'Vazgeç',
      onOk: async () => {
        try {
          await stokHareketFisiApi.remove(id)
          message.success('Fiş silindi')
          setFisNo('')
          setCariKod('')
          setDepoKod('')
          setFisTarihi(dayjs())
          setSevkTarihi(dayjs())
          setBelgeNo('')
          setKalemler([emptyKalem()])
          onDeleted?.(fisTipi)
        } catch (err: any) {
          message.error('Fiş silinirken hata: ' + (err?.message || err))
        }
      },
    })
  }

  const cariHesapIdBul = async (kod: string): Promise<number | null> => {
    const list = await cariHesapListesi()
    return list.find((c) => c.kod === kod)?.id ?? null
  }
  const depoIdBul = async (kod: string): Promise<number | null> => {
    const list = await depoListesi()
    return list.find((d) => d.kod === kod)?.id ?? null
  }
  const cariHesapListesi = async () => (await import('@/lib/cari-hesap-api')).cariHesapApi.list()
  const depoListesi = async () => (await import('@/lib/depo-api')).depoApi.list()

  const gridApiRef = useRef<GridApi<KalemRow> | null>(null)

  // Odaklanan hücrenin içindeki gerçek input/select'i otomatik odakla
  const focusCellEditor = (colId: string, rowIndex: number) => {
    const tryFocus = (attempt = 0) => {
      const cell = document.querySelector<HTMLElement>(
        `.kalemler-grid .ag-row[row-index="${rowIndex}"] .ag-cell[col-id="${colId}"]`,
      )
      const focusable = cell?.querySelector<HTMLElement>(
        'input:not([type="hidden"]), textarea, .ant-select-selector',
      )
      if (focusable) {
        // Ant Select selector'a focus için içindeki search input'u hedefle
        const realInput =
          focusable.classList.contains('ant-select-selector')
            ? (focusable.closest('.ant-select')?.querySelector<HTMLElement>('input') ?? focusable)
            : focusable
        realInput.focus({ preventScroll: true })
        if (realInput instanceof HTMLInputElement) realInput.select?.()
        // Focus gerçekten geçmediyse tekrar dene
        if (document.activeElement !== realInput && attempt < 15) {
          requestAnimationFrame(() => tryFocus(attempt + 1))
        }
      } else if (attempt < 15) {
        requestAnimationFrame(() => tryFocus(attempt + 1))
      }
    }
    requestAnimationFrame(() => tryFocus())
  }

  // Enter/Tab ile bir sonraki (sağdaki) düzenlenebilir hücreye geç
  const focusNextCell = (currentColId: string, rowIndex: number) => {
    const editableCols = minimalColDefs
      .map((c) => c.field as string)
      .filter((f) => f && f !== 'key' && f !== 'malzemeAd')
    const idx = editableCols.indexOf(currentColId)
    if (idx === -1) return
    if (idx < editableCols.length - 1) {
      const nextCol = editableCols[idx + 1]
      gridApiRef.current?.setFocusedCell(rowIndex, nextCol)
      focusCellEditor(nextCol, rowIndex)
    } else {
      // Son kolondaysak bir sonraki satırın ilk kolonuna geç
      const firstCol = editableCols[0]
      const nextRow = rowIndex + 1
      if (nextRow < kalemler.length) {
        gridApiRef.current?.setFocusedCell(nextRow, firstCol)
        focusCellEditor(firstCol, nextRow)
      }
    }
  }

  const minimalColDefs: ColDef<KalemRow>[] = [
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
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
              />
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
            updateKalem(p.data.key, { malzemeKod: kod, malzemeAd: (rec as Malzeme)?.ad ?? '', kdv })
            // Seçim yapıldıysa otomatik sonraki (Kg) hücreye geç
            if (kod && p.node.rowIndex != null) focusNextCell('malzemeKod', p.node.rowIndex)
          }}
        />
      ),
    },
    { headerName: 'Malzeme Adı', field: 'malzemeAd' },
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
  ]

  const toplam = kalemler.reduce((acc, k) => acc + (k.satirTutari || 0), 0)
  const toplamMatrah = kalemler.reduce((acc, k) => {
    const hesapMiktari = hesapMiktariGetir(k)
    return acc + hesapMiktari * (k.birimFiyat || 0)
  }, 0)
  const toplamKdv = toplam - toplamMatrah
  const kalemSayisi = kalemler.length
  const toplamKg = kalemler.reduce((acc, k) => acc + (k.kg || 0), 0)
  const toplamMt = kalemler.reduce((acc, k) => acc + (k.mt || 0), 0)
  const toplamAdet = kalemler.reduce((acc, k) => acc + (k.adet || 0), 0)

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
          <RaporSecimModal
            open={raporModalAcik}
            baslik={fisTipiLabel}
            tasarimlar={stokHareketFisiTasarimlari.map((t) => ({ id: t.id, label: t.label, aciklama: t.aciklama }))}
            onCancel={() => setRaporModalAcik(false)}
            onOnizle={(id) => handleRaporOnizle(id)}
            onIndir={(id) => handleRaporIndir(id)}
          />
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
                        <div className="!text-[12px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-1">Genel Bilgiler</div>
                        <div className="!space-y-0.5">
                          <div className="!flex !items-center !gap-3">
                            <div className="!text-[12px] !text-[#6b7280] !w-20 !shrink-0">Fiş No</div>
                            <Input size="small" value={fisNo} className="!w-48 !text-[12px]" readOnly />
                          </div>
                          <div className="!flex !items-center !gap-3">
                            <div className="!text-[12px] !text-[#6b7280] !w-20 !shrink-0">Fiş Tarihi</div>
                            <DatePicker size="small" value={fisTarihi} onChange={(d) => d && setFisTarihi(d)} format="DD.MM.YYYY" placeholder="Fiş tarihi" className="!w-48 !text-[12px]" />
                          </div>
                          <div className="!flex !items-center !gap-3">
                            <div className="!text-[12px] !text-[#6b7280] !w-20 !shrink-0">Sevk Tarihi</div>
                            <DatePicker size="small" value={sevkTarihi} onChange={(d) => d && setSevkTarihi(d)} format="DD.MM.YYYY" placeholder="Sevk tarihi" className="!w-48 !text-[12px]" />
                          </div>
                          <div className="!flex !items-center !gap-3">
                            <div className="!text-[12px] !text-[#6b7280] !w-20 !shrink-0">Belge No</div>
                            <Input size="small" value={belgeNo} onChange={(e) => setBelgeNo(e.target.value)} className="!w-48 !text-[12px]" />
                          </div>
                        </div>
                      </div>

                      <div className="!flex-1 !border !border-gray-200 !rounded-sm !p-2">
                        <div className="!text-[12px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-1">Cari Hesap Bilgileri</div>
                        <div className="!space-y-0.5">
                          <div className="!flex !items-center !gap-3">
                            <div className="!text-[12px] !text-[red] !w-20 !shrink-0">Cari Hesap</div>
                            <SearchableCariSelect value={cariKod} onChange={(kod) => setCariKod(kod)} />
                          </div>
                          <div className="!flex !items-center !gap-3">
                            <div className="!text-[12px] !text-[#6b7280] !w-20 !shrink-0">Adres</div>
                            <Input size="small" className="!w-48 !text-[12px]" />
                          </div>
                          <div className="!flex !items-center !gap-3">
                            <div className="!text-[12px] !text-[#6b7280] !w-20 !shrink-0">Yetkili</div>
                            <Input size="small" className="!w-48 !text-[12px]" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="!border !border-gray-200 !rounded-sm !p-2">
                      <div className="!text-[12px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-1">Döviz Bilgileri</div>
                        <div className="!space-y-0.5">
                          <div className="!flex !items-center !gap-3">
                            <div className="!text-[12px] !text-[#6b7280] !w-20 !shrink-0">Döviz</div>
                            <div className="!flex !items-center !gap-1 !w-48">
                              <Select size="small" className="!flex-1 !min-w-0 !text-[12px]" options={[{ value: 'tl', label: 'TL' }, { value: 'usd', label: 'USD' }, { value: 'eur', label: 'EUR' }]} />
                              <Input size="small" className="!flex-1 !min-w-0 !text-[12px]" placeholder="Kur" />
                            </div>
                          </div>
                        </div>
                    </div>

                    <div className="!border !border-gray-200 !rounded-sm !p-2">
                      <div className="!text-[12px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-1">Depo Bilgileri</div>
                      <div className="!flex !items-center !gap-3">
                        <div className="!text-[12px] !text-[red] !w-20 !shrink-0">Depo</div>
                        <SearchableDepoSelect value={depoKod} onChange={(kod) => setDepoKod(kod)} />
                      </div>
                    </div>
                  </div>

                  <div className="!border !border-gray-200 !rounded-sm !flex-1 !min-h-0 !flex !flex-col !mt-1.5">
                    <div className="!flex !items-center !justify-between !px-3 !pt-2 !pb-1 !flex-shrink-0">
                      <div className="!text-[12px] !font-bold !text-[#333] !uppercase !tracking-wide">Satır Detayları</div>
                      <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={addKalem} className="!text-[12px]">
                        Satır Ekle
                      </Button>
                    </div>
                    <div style={{ height: 220, width: '100%' }} className="kalemler-grid">
                      <AgGridReact
                        rowData={kalemler}
                        columnDefs={minimalColDefs}
                        theme={antTheme}
                        headerHeight={32}
                        rowHeight={30}
                        rowSelection="single"
                        getRowId={(p) => p.data.key}
                        localeText={agGridLocaleTR}
                        defaultColDef={{ resizable: true, sortable: true }}
                        onGridReady={(e) => { gridApiRef.current = e.api }}
                        tabToNextCell={(params) => {
                          // Tab: sil/malzemeAd kolonlarını atlayarak sonraki düzenlenebilir hücreye git
                          const editableCols = minimalColDefs
                            .map((c) => c.field as string)
                            .filter((f) => f && f !== 'key' && f !== 'malzemeAd')
                          const prev = params.previousCellPosition
                          if (!prev) return params.nextCellPosition ?? false
                          const curCol = prev.column.getColId()
                          const curIdx = editableCols.indexOf(curCol)
                          const rowCount = kalemler.length
                          let colIdx = curIdx
                          let rowIndex = prev.rowIndex
                          if (params.backwards) {
                            colIdx -= 1
                            if (colIdx < 0) { colIdx = editableCols.length - 1; rowIndex -= 1 }
                          } else {
                            colIdx += 1
                            if (colIdx > editableCols.length - 1) { colIdx = 0; rowIndex += 1 }
                          }
                          if (rowIndex < 0 || rowIndex >= rowCount) return prev
                          const col = gridApiRef.current?.getColumn(editableCols[colIdx])
                          if (!col) return prev
                          return { rowIndex, column: col, rowPinned: null }
                        }}
                        onCellFocused={(e: CellFocusedEvent) => {
                          const colId = typeof e.column === 'object' && e.column ? e.column.getColId() : undefined
                          if (colId && colId !== 'key' && colId !== 'malzemeAd' && e.rowIndex != null) {
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
                            Kalem: <span className="!font-semibold !tabular-nums">{kalemSayisi}</span>
                          </span>
                          <span className="!text-[#d1d5db]">|</span>
                          <span>
                            Kg: <span className="!font-semibold !tabular-nums">{numberFormat(toplamKg)}</span>
                          </span>
                          <span className="!text-[#d1d5db]">|</span>
                          <span>
                            Mt: <span className="!font-semibold !tabular-nums">{numberFormat(toplamMt)}</span>
                          </span>
                          <span className="!text-[#d1d5db]">|</span>
                          <span>
                            Adet: <span className="!font-semibold !tabular-nums">{numberFormat(toplamAdet)}</span>
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
              ),
            },
          ]}
        />
      </div>
      </div>
    </Spin>
  )
}
