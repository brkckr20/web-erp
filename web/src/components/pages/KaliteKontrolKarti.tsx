'use client'

import { Tabs, Input, DatePicker, Button, App, Tooltip, Popconfirm, Spin, Dropdown } from 'antd'
import { useState, useEffect, useMemo, useRef } from 'react'
import { toSVG } from '@bwip-js/browser'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community'
import type { ColDef, GridApi, CellFocusedEvent } from 'ag-grid-community'
import dayjs from 'dayjs'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import SearchableCariSelect from '@/components/shared/SearchableCariSelect'
import SearchableDepoSelect from '@/components/shared/SearchableDepoSelect'
import SearchableMalzemeSelect from '@/components/shared/SearchableMalzemeSelect'
import SearchableIsEmriSelect from '@/components/shared/SearchableIsEmriSelect'
import { kaliteKontrolApi } from '@/lib/kalite-kontrol-api'
import { isEmriApi } from '@/lib/is-emri-api'
import { type Malzeme } from '@/lib/malzeme-api'
import HataModal from '@/components/shared/HataModal'
import EtiketOnizleme from '@/components/shared/EtiketOnizleme'
import IsEmriSecimiModal from '@/components/shared/IsEmriSecimiModal'
import { agGridLocaleTR } from '@/lib/ag-grid-locale'
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

interface KKFormProps {
  id?: number
  onDeleted?: () => void
}

interface KalemRow {
  key: string
  barkod: string
  malzemeId: number | null
  malzemeKod: string
  malzemeAd: string
  kg: number
  mt: number
  adet: number
  hataMiktar: number
  aciklama: string
  isEmriNo: string
  isEmriId: number | null
  isEmriKg: number
  hatalar: { hataKodu: string; hataAdi: string; miktar?: number; aciklama?: string }[]
  stokFisNo?: string | null
}

const emptyKalem = (): KalemRow => ({
  key: Math.random().toString(36).slice(2),
  barkod: '',
  malzemeId: null,
  malzemeKod: '',
  malzemeAd: '',
  kg: 0,
  mt: 0,
  adet: 0,
  hataMiktar: 0,
  aciklama: '',
  isEmriNo: '',
  isEmriId: null,
  isEmriKg: 0,
  hatalar: [],
})

const incrementBarkod = (barkod: string): string => {
  const m = barkod.match(/(\d+)$/)
  if (!m) return barkod
  const num = m[1]
  const next = String(Number(num) + 1).padStart(num.length, '0')
  return barkod.slice(0, m.index) + next
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

export default function KaliteKontrolKarti({ id: propId, onDeleted }: KKFormProps) {
  const { message } = App.useApp()
  const { modal } = App.useApp()
  const { kullanici } = useAuth()
  const kayitYapan = kullanici ? `${kullanici.kod} - ${kullanici.ad}` : null
  const [id, setId] = useState<number | null>(propId ?? null)
  const [fisNo, setFisNo] = useState('')
  const [isEmriKod, setIsEmriKod] = useState<string>('')
  const [isEmriId, setIsEmriId] = useState<number | null>(null)
  const [isEmriMalzemeKodlari, setIsEmriMalzemeKodlari] = useState<string[]>([])
  const [siparisNo, setSiparisNo] = useState<string>('')
  const [cariKod, setCariKod] = useState<string>('')
  const [cariHesapId, setCariHesapId] = useState<number | null>(null)
  const [depoKod, setDepoKod] = useState<string>('')
  const [depoId, setDepoId] = useState<number | null>(null)
  const [fisTarihi, setFisTarihi] = useState(dayjs())
  const [aciklama, setAciklama] = useState('')
  const [kalemler, setKalemler] = useState<KalemRow[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stokFisId, setStokFisId] = useState<number | null>(null)
  const [hataModalRow, setHataModalRow] = useState<KalemRow | null>(null)
  const [etiketOpen, setEtiketOpen] = useState(false)
  const [etiketKalemler, setEtiketKalemler] = useState<{ barkod: string; malzemeKod: string; malzemeAd: string; kg: number; mt: number; adet: number; hatalar: { hataKodu: string; hataAdi: string; aciklama?: string }[] }[]>([])
  const [isEmriModalOpen, setIsEmriModalOpen] = useState(false)
  const focusedRowIndexRef = useRef<number | null>(null)

  useEffect(() => {
    setId(propId ?? null)
    if (propId) {
      setLoading(true)
      kaliteKontrolApi
        .get(propId)
        .then((f: any) => {
          setFisNo(f.fisNo)
          setStokFisId(f.stokFisId ?? null)
          if (f.fisTarihi) setFisTarihi(dayjs(f.fisTarihi))
          setAciklama(f.aciklama ?? '')
          setCariKod(f.cariHesap?.kod ?? '')
          setCariHesapId(f.cariHesapId ?? null)
          setDepoKod(f.depo?.kod ?? '')
          setDepoId(f.depoId ?? null)
          setIsEmriKod(f.isEmri?.isEmriNo ?? '')
          setIsEmriId(f.isEmriId ?? null)
          setSiparisNo(f.siparisNo ?? '')
          if (f.isEmri?.isEmriNo) {
            isEmriApi
              .getByKod(f.isEmri.isEmriNo)
              .then((ie: any) => {
                setIsEmriMalzemeKodlari(
                  (ie.kalemler ?? []).map((k: any) => k.malzemeKod).filter((c: any) => !!c),
                )
              })
              .catch(() => setIsEmriMalzemeKodlari([]))
          } else {
            setIsEmriMalzemeKodlari([])
          }
          if (f.kalemler && f.kalemler.length > 0) {
            setKalemler(f.kalemler.map((k: any) => ({
              key: Math.random().toString(36).slice(2),
              barkod: k.barkod ?? '',
              malzemeId: k.malzemeId ?? null,
              malzemeKod: k.malzeme?.kod ?? '',
              malzemeAd: k.malzeme?.ad ?? '',
              kg: Number(k.netAgirlik) || 0,
              mt: Number(k.netMetre) || 0,
              adet: k.adet || 0,
              hataMiktar: k.hataMiktar || 0,
              aciklama: k.aciklama ?? '',
              isEmriNo: k.isEmriNo ?? '',
              isEmriId: null,
              isEmriKg: Number(k.isEmriKg) || 0,
              hatalar: (k.hatalar || []).map((h: any) => ({
                hataKodu: h.hataKodu,
                hataAdi: h.hataAdi,
                miktar: h.miktar ?? undefined,
                aciklama: h.aciklama ?? undefined,
              })),
              stokFisNo: k.stokFis?.fisNo ?? null,
            })))
          }
        })
        .catch((err) => message.error('Yüklenemedi: ' + (err?.message || err)))
        .finally(() => setLoading(false))
    } else {
      setId(null)
      setStokFisId(null)
      setCariKod('')
      setCariHesapId(null)
      setDepoKod('')
      setDepoId(null)
      setAciklama('')
      setIsEmriKod('')
      setIsEmriId(null)
      setIsEmriMalzemeKodlari([])
      setSiparisNo('')
      setFisTarihi(dayjs())
      setKalemler([])
      kaliteKontrolApi
        .nextFisNo()
        .then((res) => setFisNo(res.fisNo))
        .catch(() => setFisNo('00000001'))
    }
  }, [propId])

  const addKalem = async (fromRow?: KalemRow) => {
    const newRow = emptyKalem()
    if (fromRow && fromRow.malzemeKod) {
      newRow.malzemeId = fromRow.malzemeId
      newRow.malzemeKod = fromRow.malzemeKod
      newRow.malzemeAd = fromRow.malzemeAd
      newRow.isEmriNo = fromRow.isEmriNo
      newRow.isEmriId = fromRow.isEmriId
      newRow.isEmriKg = fromRow.isEmriKg
    }
    if (depoKod) {
      try {
        let barkod = (await kaliteKontrolApi.nextBarkod(depoKod)).barkod
        if (fromRow?.barkod) barkod = incrementBarkod(fromRow.barkod)
        const existing = new Set(kalemler.map((k) => k.barkod).filter(Boolean))
        while (existing.has(barkod)) {
          barkod = incrementBarkod(barkod)
        }
        newRow.barkod = barkod
      } catch {
        // barkod alınamadı, boş geç
      }
    }
    setKalemler((prev) => [...prev, newRow])
    return newRow
  }
  const handleIsEmriSecimi = async (secimler: { isEmriNo: string; isEmriId: number; malzemeId: number | null; malzemeKod: string; malzemeAd: string; kg: number; mt: number; adet: number }[], gelenIsEmriNo: string) => {
    if (!isEmriKod) {
      setIsEmriKod(gelenIsEmriNo)
      try {
        const ie = await isEmriApi.getByKod(gelenIsEmriNo)
        setIsEmriId(ie.id)
        setSiparisNo(ie.siparisNo ?? '')
        setIsEmriMalzemeKodlari(
          (ie.kalemler ?? []).map((k: any) => k.malzemeKod).filter(Boolean),
        )
      } catch {
        // iş emri detayı alınamadı
      }
    }
    const existingKodlar = new Set(kalemler.map((k) => k.malzemeKod).filter(Boolean))
    const yeniKalemler = secimler
      .filter((s) => !existingKodlar.has(s.malzemeKod))
      .map((s) => ({
        ...emptyKalem(),
        malzemeId: s.malzemeId,
        malzemeKod: s.malzemeKod,
        malzemeAd: s.malzemeAd,
        isEmriNo: s.isEmriNo,
        isEmriId: s.isEmriId,
        isEmriKg: s.kg,
        kg: 0,
        mt: 0,
        adet: 0,
      }))
    if (yeniKalemler.length === 0) {
      message.info('Seçilen kalemler zaten satırlarda mevcut')
      return
    }
    if (depoKod) {
      try {
        let barkod = (await kaliteKontrolApi.nextBarkod(depoKod)).barkod
        const existing = new Set(kalemler.map((k) => k.barkod).filter(Boolean))
        for (const row of yeniKalemler) {
          while (existing.has(barkod)) {
            barkod = incrementBarkod(barkod)
          }
          row.barkod = barkod
          existing.add(barkod)
          barkod = incrementBarkod(barkod)
        }
      } catch {
        // barkod alınamadı
      }
    }
    setKalemler((prev) => [...prev, ...yeniKalemler])
    message.success(`${yeniKalemler.length} kalem eklendi`)
  }

  const removeKalem = (key: string) =>
    setKalemler((prev) => prev.filter((k) => k.key !== key))

  const updateKalem = (key: string, patch: Partial<KalemRow>) => {
    setKalemler((prev) =>
      prev.map((k) => (k.key !== key ? k : { ...k, ...patch })),
    )
  }

  const openHataModal = (row: KalemRow) => setHataModalRow(row)
  const closeHataModal = () => setHataModalRow(null)

  const updateHatalar = (key: string, hatalar: { hataKodu: string; hataAdi: string; aciklama?: string }[]) => {
    setKalemler((prev) => prev.map((k) => (k.key !== key ? k : { ...k, hatalar })))
  }

  const handleKaydet = async () => {
    setSaving(true)
    try {
      const kalemPayload = kalemler
        .filter((k) => k.malzemeKod)
        .map((k) => ({
          barkod: k.barkod || null,
          malzemeId: k.malzemeId || undefined,
          netAgirlik: k.kg || undefined,
          netMetre: k.mt || undefined,
          adet: k.adet || undefined,
          hataMiktar: k.hataMiktar || undefined,
          aciklama: k.aciklama || null,
          isEmriNo: k.isEmriNo || null,
          isEmriKg: k.isEmriKg || undefined,
          hatalar: k.hatalar.length > 0 ? k.hatalar.map((h) => ({
            hataKodu: h.hataKodu,
            hataAdi: h.hataAdi,
            miktar: h.miktar || null,
            aciklama: h.aciklama || null,
          })) : undefined,
        }))

      const data = {
        fisNo,
        fisTarihi: fisTarihi.format('YYYY-MM-DD'),
        aciklama: aciklama || null,
        kayitYapan,
        depoId: depoId || undefined,
        cariHesapId: cariHesapId || undefined,
        isEmriId: isEmriId || undefined,
        kalemler: kalemPayload,
      }

      if (id) {
        await kaliteKontrolApi.update(id, data as any)
        message.success('Güncellendi')
      } else {
        const created = await kaliteKontrolApi.create(data as any)
        setId(created.id)
        message.success('Kaydedildi')
      }
    } catch (err: any) {
      message.error('Hata: ' + (err?.message || err))
    } finally {
      setSaving(false)
    }
  }

  const handleSil = () => {
    if (!id) {
      message.warning('Önce kaydedilmiş bir fiş olmalı')
      return
    }
    modal.confirm({
      title: 'Fişi Sil',
      content: `${fisNo} nolu kalite kontrol fişini silmek istediğinize emin misiniz?`,
      okText: 'Evet, sil',
      okButtonProps: { danger: true },
      cancelText: 'Vazgeç',
      onOk: async () => {
        try {
          await kaliteKontrolApi.remove(id)
          message.success('Fiş silindi')
          setFisNo('')
          setIsEmriKod('')
          setCariKod('')
          setDepoKod('')
          setFisTarihi(dayjs())
          setAciklama('')
          setKalemler([])
          onDeleted?.()
        } catch (err: any) {
          message.error('Fiş silinirken hata: ' + (err?.message || err))
        }
      },
    })
  }

  const handleStogaAl = async () => {
    if (!id) { message.warning('Önce fişi kaydedin'); return }
    if (stokFisId) { message.warning('Bu fiş zaten stoğa alınmış'); return }
    const malzemeOlanKalemler = kalemler.filter((k) => k.malzemeId)
    if (malzemeOlanKalemler.length === 0) { message.warning('Stoğa alınabilecek kalem bulunamadı (malzeme seçilmemiş)'); return }
    modal.confirm({
      title: 'Stoğa Al',
      content: `${malzemeOlanKalemler.length} kalem stoğa alınacak. Devam etmek istediğinize emin misiniz?`,
      okText: 'Evet, stoğa al',
      cancelText: 'Vazgeç',
      onOk: async () => {
        try {
          const stokFis = await kaliteKontrolApi.stogaAl(id)
          setStokFisId(stokFis.id)
          message.success(`Stok fişi oluşturuldu: ${stokFis.fisNo}`)
        } catch (err: any) {
          message.error('Stoğa alınırken hata: ' + (err?.message || err))
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

  const fmt = (v: number) => v ? new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) : ''

  const directPrint = (row: KalemRow) => {
    let barkodSvg = ''
    if (row.barkod) {
      try {
        barkodSvg = toSVG({
          bcid: 'code128', text: row.barkod,
          scale: 3, height: 12,
          includetext: true, textxalign: 'center', textsize: 9,
        })
      } catch {}
    }
    const hataHtml = row.hatalar.length > 0
      ? `<hr><div style="font-weight:bold;font-size:10px">HATALAR</div>${row.hatalar.map((h) => `<div style="font-size:10px">▸ ${h.hataKodu} ${h.hataAdi}${h.miktar ? ` x${h.miktar}` : ''}</div>`).join('')}`
      : ''
    const html = `<div class="barkod-etiket" style="width:100mm;height:150mm;box-sizing:border-box;padding:6mm 5mm;font-size:11px;font-family:Arial,sans-serif;display:flex;flex-direction:column;gap:4px;background:white">
      <div style="font-weight:bold;font-size:13px">KK FİŞ: ${fisNo}</div>
      <div>İş Emri: ${isEmriKod || '-'}</div>
      <div>Sipariş : ${siparisNo || '-'}</div>
      <div>Tarih  : ${fisTarihi.format('DD.MM.YYYY')}</div>
      <hr style="width:100%;border:none;border-top:1px solid #999;margin:4px 0">
      <div style="font-weight:bold">Malzeme: ${row.malzemeKod}</div>
      <div style="font-size:10px">${row.malzemeAd}</div>
      <hr style="width:100%;border:none;border-top:1px solid #999;margin:4px 0">
      <div style="display:flex;gap:16px">${row.kg ? `<span>Kg: ${fmt(row.kg)}</span>` : ''}${row.mt ? `<span>Mt: ${fmt(row.mt)}</span>` : ''}${row.adet ? `<span>Adet: ${row.adet}</span>` : ''}</div>
      ${hataHtml}
      <div style="flex:1"></div>
      ${barkodSvg ? `<div style="display:flex;justify-content:center">${barkodSvg}</div>` : ''}
      <div style="text-align:center;font-size:10px">${row.barkod}</div>
    </div>`
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<html><head><title>Etiket</title><style>@page{margin:0;size:100mm 150mm}body{margin:0}</style></head><body>${html}</body></html>`)
    w.document.close()
    setTimeout(() => { w.print(); w.close() }, 500)
  }

  const gridApiRef = useRef<GridApi<KalemRow> | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
      if (e.ctrlKey && !e.shiftKey && !e.altKey && (e.key === 'H' || e.key === 'h')) {
        e.preventDefault()
        const idx = focusedRowIndexRef.current
        if (idx != null && idx >= 0 && idx < kalemler.length) {
          openHataModal(kalemler[idx])
        }
      }
      if (!e.ctrlKey && !e.shiftKey && !e.altKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault()
        const idx = focusedRowIndexRef.current
        if (idx != null && idx >= 0 && idx < kalemler.length) {
          directPrint(kalemler[idx])
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [kalemler])

  const focusCellEditor = (colId: string, rowIndex: number) => {
    const tryFocus = (attempt = 0) => {
      const cell = document.querySelector<HTMLElement>(
        `.kk-grid .ag-row[row-index="${rowIndex}"] .ag-cell[col-id="${colId}"]`,
      )
      const focusable = cell?.querySelector<HTMLElement>(
        'input:not([type="hidden"]), textarea',
      )
      if (focusable) {
        focusable.focus({ preventScroll: true })
        if (focusable instanceof HTMLInputElement) focusable.select?.()
        if (document.activeElement !== focusable && attempt < 15) {
          requestAnimationFrame(() => tryFocus(attempt + 1))
        }
      } else if (attempt < 15) {
        requestAnimationFrame(() => tryFocus(attempt + 1))
      }
    }
    requestAnimationFrame(() => tryFocus())
  }

  const focusNextCell = (currentColId: string, rowIndex: number) => {
    const editableCols = kolonDefs.map((c) => c.field as string).filter((f) => f && !['malzemeAd', 'isEmriNo', 'isEmriKg'].includes(f))
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

  const kolonDefs: ColDef<KalemRow>[] = useMemo(() => [
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
      headerName: 'Barkod', field: 'barkod', width: 130, cellClass: '!p-0',
      cellRenderer: (p: { data: KalemRow }) => (
        <Input
          size="small"
          variant="borderless"
          value={p.data.barkod}
          onChange={(e) => updateKalem(p.data.key, { barkod: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              focusNextCell('barkod', kalemler.indexOf(p.data))
            }
          }}
          className="!h-full !text-[12px] !rounded-none !px-2"
        />
      ),
    },
    {
      headerName: 'Malzeme Kodu', field: 'malzemeKod', width: 170, cellClass: '!p-0',
      cellRenderer: (p: { data: KalemRow; node: { rowIndex: number | null } }) => (
        <SearchableMalzemeSelect
          value={p.data.malzemeKod}
          widthClass="!w-full"
          className="!w-full !h-full !text-[12px] kalem-select"
          filterKodlar={isEmriMalzemeKodlari}
          onChange={(kod, rec) => {
            const mal = rec as Malzeme | undefined
            updateKalem(p.data.key, { malzemeId: mal?.id ?? null, malzemeKod: kod, malzemeAd: mal?.ad ?? '' })
            if (kod && p.node.rowIndex != null) focusNextCell('malzemeKod', p.node.rowIndex)
          }}
        />
      ),
    },
    {
      headerName: 'Malzeme Adı', field: 'malzemeAd', flex: 1, minWidth: 140,
      cellRenderer: (p: { data: KalemRow }) => (
        <div className="!h-full !flex !items-center !px-2 !text-[12px] !text-[#6b7280]">
          {p.data.malzemeAd}
        </div>
      ),
    },
    {
      headerName: 'Üretim Emri', field: 'isEmriNo', width: 120,
      cellClass: '!text-[#f57c00] !font-medium',
      cellRenderer: (p: { data: KalemRow }) => (
        <div className="!h-full !flex !items-center !px-2 !text-[12px]">
          {p.data.isEmriNo}
        </div>
      ),
    },
    {
      headerName: 'İş Emri Miktarı', field: 'isEmriKg', width: 110, type: 'rightAligned',
      cellRenderer: (p: { data: KalemRow }) => (
        <div className="!h-full !flex !items-center !px-2 !text-[12px] !text-[#6b7280] !justify-end">
          {formatTR(p.data.isEmriKg)}
        </div>
      ),
    },
    {
      headerName: 'Kg', field: 'kg', width: 100, type: 'rightAligned', cellClass: '!p-0',
      cellRenderer: (p: { data: KalemRow }) => (
        <TurkishNumberInput
          value={p.data.kg}
          onChange={(v) => updateKalem(p.data.key, { kg: v })}
          onEnter={() => focusNextCell('kg', kalemler.indexOf(p.data))}
          className="!h-full !text-[12px] !rounded-none !px-2 !text-right"
        />
      ),
    },
    {
      headerName: 'Mt', field: 'mt', width: 100, type: 'rightAligned', cellClass: '!p-0',
      cellRenderer: (p: { data: KalemRow }) => (
        <TurkishNumberInput
          value={p.data.mt}
          onChange={(v) => updateKalem(p.data.key, { mt: v })}
          onEnter={() => focusNextCell('mt', kalemler.indexOf(p.data))}
          className="!h-full !text-[12px] !rounded-none !px-2 !text-right"
        />
      ),
    },
    {
      headerName: 'Adet', field: 'adet', width: 100, type: 'rightAligned', cellClass: '!p-0',
      cellRenderer: (p: { data: KalemRow }) => (
        <Input
          size="small"
          variant="borderless"
          type="number"
          value={p.data.adet || ''}
          onChange={(e) => updateKalem(p.data.key, { adet: Number(e.target.value) || 0 })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              focusNextCell('adet', kalemler.indexOf(p.data))
            }
          }}
          className="!h-full !text-[12px] !rounded-none !px-2 !text-right"
        />
      ),
    },
    {
      headerName: 'Açıklama', field: 'aciklama', width: 150, cellClass: '!p-0',
      cellRenderer: (p: { data: KalemRow }) => (
        <Input
          size="small"
          variant="borderless"
          value={p.data.aciklama}
          onChange={(e) => updateKalem(p.data.key, { aciklama: e.target.value })}
          className="!h-full !text-[12px] !rounded-none !px-2"
        />
      ),
    },
    {
      headerName: 'Hata Miktarı', field: 'hataMiktar', width: 100, type: 'rightAligned', cellClass: '!p-0',
      cellRenderer: (p: { data: KalemRow }) => (
        <Input
          size="small"
          variant="borderless"
          type="number"
          value={p.data.hataMiktar || ''}
          onChange={(e) => updateKalem(p.data.key, { hataMiktar: Number(e.target.value) || 0 })}
          className="!h-full !text-[12px] !rounded-none !px-2 !text-right"
        />
      ),
    },
    {
      headerName: 'Stok', field: 'stokFisNo', width: 140,
      cellClass: (p) => p.value ? '!text-[#16a34a] !font-medium' : '!text-[#9ca3af]',
      cellRenderer: (p: { data: KalemRow }) => (
        <div className="!h-full !flex !items-center !px-2 !text-[11px]">
          {p.data.stokFisNo ? `✓ ${p.data.stokFisNo}` : '— Aktarılmadı'}
        </div>
      ),
    },
  ], [kalemler])

  const toplamKg = useMemo(() => kalemler.reduce((s, k) => s + (k.kg || 0), 0), [kalemler])
  const toplamMt = useMemo(() => kalemler.reduce((s, k) => s + (k.mt || 0), 0), [kalemler])
  const toplamAdet = useMemo(() => kalemler.reduce((s, k) => s + (k.adet || 0), 0), [kalemler])
  const kalemSayisi = useMemo(() => kalemler.filter((k) => k.malzemeKod).length, [kalemler])

  if (loading) {
    return <div className="!p-6"><Spin /></div>
  }

  return (
    <>
    {hataModalRow && (
      <HataModal
        key={hataModalRow.key}
        open={!!hataModalRow}
        hatalar={hataModalRow.hatalar}
        onClose={closeHataModal}
        onSave={(hatalar) => updateHatalar(hataModalRow.key, hatalar)}
      />
    )}
    <div className="!p-0 !flex !flex-col !h-full">
      <CardToolbar
        buttons={createToolbarButtons({
          onSave: handleKaydet,
          onDelete: handleSil,
          onReport: () => {
            if (focusedRowIndexRef.current != null && focusedRowIndexRef.current >= 0 && focusedRowIndexRef.current < kalemler.length) {
              const row = kalemler[focusedRowIndexRef.current]
              setEtiketKalemler([{
                barkod: row.barkod,
                malzemeKod: row.malzemeKod,
                malzemeAd: row.malzemeAd,
                kg: row.kg,
                mt: row.mt,
                adet: row.adet,
                hatalar: row.hatalar,
              }])
            } else {
              setEtiketKalemler(kalemler.map((k) => ({
                barkod: k.barkod,
                malzemeKod: k.malzemeKod,
                malzemeAd: k.malzemeAd,
                kg: k.kg,
                mt: k.mt,
                adet: k.adet,
                hatalar: k.hatalar,
              })))
            }
            setEtiketOpen(true)
          },
        }, {
          delete: { onClick: handleSil, label: 'Sil', disabled: !id, danger: true },
        })}
      />
      <div className="!flex-1 !min-h-0 !flex !flex-col !p-3 !overflow-auto">
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
                      <div className="!flex !flex-col !gap-1.5 !shrink-0">
                        <div className="!border !border-gray-200 !rounded-sm !p-2">
                          <div className="!text-[12px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-1">Genel Bilgiler</div>
                          <div className="!space-y-0.5">
                            <div className="!flex !items-center !gap-3">
                              <div className="!text-[12px] !text-[#6b7280] !w-20 !shrink-0">Fiş No</div>
                              <Input size="small" value={fisNo} onChange={(e) => setFisNo(e.target.value)} className="!w-48 !text-[12px]" />
                            </div>
                            <div className="!flex !items-center !gap-3">
                              <div className="!text-[12px] !text-[#6b7280] !w-20 !shrink-0">Fiş Tarihi</div>
                              <DatePicker size="small" value={fisTarihi} onChange={(d) => d && setFisTarihi(d)} format="DD.MM.YYYY" placeholder="Fiş tarihi" className="!w-48 !text-[12px]" />
                            </div>
                            <div className="!flex !items-center !gap-3">
                              <div className="!text-[12px] !text-[#6b7280] !w-20 !shrink-0">Açıklama</div>
                              <Input size="small" value={aciklama} onChange={(e) => setAciklama(e.target.value)} className="!flex-1 !text-[12px]" />
                            </div>
                          </div>
                        </div>
                        <div className="!border !border-gray-200 !rounded-sm !p-2">
                          <div className="!text-[12px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-1">Depo Bilgileri</div>
                          <div className="!flex !items-start !gap-3">
                            <div className="!text-[12px] !text-[red] !w-20 !shrink-0 !pt-0.5">Depo</div>
                            <div className="!flex !flex-col !gap-1.5 !flex-1 !w-48">
                              <SearchableDepoSelect value={depoKod} onChange={(kod, rec) => { setDepoKod(kod); setDepoId(kod ? (rec as any)?.id ?? null : null) }} />
                              <Button
                                size="small"
                                type="default"
                                block
                                onClick={() => setIsEmriModalOpen(true)}
                                className="!text-[11px]"
                              >
                                İş Emirleri
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="!flex-1 !border !border-gray-200 !rounded-sm !p-2">
                        <div className="!text-[12px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-1">Cari Hesap Bilgileri</div>
                        <div className="!space-y-0.5">
                          <div className="!flex !items-center !gap-3">
                            <div className="!text-[12px] !text-[red] !w-20 !shrink-0">Cari Hesap</div>
                            <SearchableCariSelect value={cariKod} onChange={(kod, rec) => { setCariKod(kod); setCariHesapId(kod ? (rec as any)?.id ?? null : null) }} />
                          </div>
                        </div>
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
                    <Dropdown
                      menu={{
                        items: [
                          { key: 'stogaAl', label: 'Stoğa Al', disabled: !id || !!stokFisId, onClick: handleStogaAl },
                        ],
                      }}
                      trigger={['contextMenu']}
                    >
                      <div style={{ height: 300, width: '100%' }} className="kk-grid">
                      <AgGridReact
                        rowData={kalemler}
                        columnDefs={kolonDefs}
                        theme={antTheme}
                        headerHeight={32}
                        rowHeight={30}
                        rowSelection="single"
                        getRowId={(p) => p.data.key}
                        localeText={agGridLocaleTR}
                        defaultColDef={{ resizable: true, sortable: true }}
                        onGridReady={(e) => { gridApiRef.current = e.api }}
                        onCellKeyDown={async (e: any) => {
                          if (e.event?.key !== 'ArrowDown') return
                          const rowIndex = e.node?.rowIndex
                          if (rowIndex == null) return
                          // sadece son satırdayken ve malzeme doluyken yeni satır aç
                          if (rowIndex !== kalemler.length - 1) return
                          const cur = kalemler[rowIndex]
                          if (!cur || !cur.malzemeKod) return
                          const added = await addKalem(cur)
                          setTimeout(() => {
                            gridApiRef.current?.setFocusedCell(rowIndex + 1, 'barkod')
                          }, 50)
                        }}
                        tabToNextCell={(params) => {
                          const editableCols = kolonDefs
                            .map((c) => c.field as string)
                            .filter((f) => f && !['key', 'malzemeAd', 'isEmriNo', 'isEmriKg'].includes(f))
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
                          if (e.rowIndex != null) focusedRowIndexRef.current = e.rowIndex
                          if (colId && colId !== 'key' && colId !== 'malzemeAd' && colId !== 'isEmriNo' && colId !== 'isEmriKg' && e.rowIndex != null) {
                            focusCellEditor(colId, e.rowIndex)
                          }
                        }}
                      />
                    </div>
                    </Dropdown>
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
                            Adet: <span className="!font-semibold !tabular-nums">{toplamAdet}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              ),
            },
          ]}
        />
      </div>
      <IsEmriSecimiModal
        open={isEmriModalOpen}
        onClose={() => setIsEmriModalOpen(false)}
        onSelect={handleIsEmriSecimi}
      />
      <EtiketOnizleme
        open={etiketOpen}
        fis={{ fisNo, isEmriNo: isEmriKod, siparisNo, tarih: fisTarihi.format('DD.MM.YYYY') }}
        kalemler={etiketKalemler}
        onClose={() => setEtiketOpen(false)}
      />
    </div>
    </>
  )
}
