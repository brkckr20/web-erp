'use client'

import { Input, DatePicker, Button, App, Tooltip, Popconfirm, Spin, Dropdown, Modal } from 'antd'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { toSVG } from '@bwip-js/browser'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community'
import type { ColDef, GridApi, CellFocusedEvent, CellContextMenuEvent, SelectionChangedEvent } from 'ag-grid-community'
import dayjs from 'dayjs'
import { PlusOutlined, DeleteOutlined, InboxOutlined } from '@ant-design/icons'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import SearchableDepoSelect from '@/components/shared/SearchableDepoSelect'
import SearchableMalzemeSelect from '@/components/shared/SearchableMalzemeSelect'
import SearchableIsEmriSelect from '@/components/shared/SearchableIsEmriSelect'
import { kaliteKontrolApi } from '@/lib/kalite-kontrol-api'
import { useKirli } from '@/lib/kirli'
import { irsaliyeApi } from '@/lib/irsaliye-api'
import { kalemMiktari } from '@/lib/miktar'
import { isEmriApi } from '@/lib/is-emri-api'
import { type Malzeme } from '@/lib/malzeme-api'
import HataModal from '@/components/shared/HataModal'
import EtiketOnizleme from '@/components/shared/EtiketOnizleme'
import IsEmriSecimiModal from '@/components/shared/IsEmriSecimiModal'
import { agGridLocaleTR } from '@/lib/ag-grid-locale'
import DataGrid from '@/components/shared/DataGrid'
import { incrementBarkod } from '@/lib/barkod'
import { sablonApi, type Sablon } from '@/lib/sablon-api'
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
  /** Sekme paneli aktifken global kısayollar (F10 / Ctrl+H) çalışsın. */
  active?: boolean
  /** Kaydedilmemiş değişiklik durumu AppLayout'taki sekme rozeti için bildirilir. */
  onKirliChange?: (kirli: boolean) => void
}

interface KalemRow {
  key: string
  /** KK kaleminin DB id'si (şablon SQL'i için). Kaydedilmeden önce null. */
  kalemId: number | null
  barkod: string
  /** Partiye bağlı kaçıncı top? Sunucu atar (salt-okunur). */
  topNo: number | null
  /** Satırın geldiği 11 fiş no (salt-okunur). */
  irsaliyeNo: string
  /** Bu top hangi irsaliye kaleminden (11-Fasondan Giriş) geldi? */
  irsaliyeKalemId: number | null
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

interface BekleyenRow {
  key: string
  irsaliyeKalemId: number
  fisNo: string
  tarih: string
  cariAd: string
  cariHesapId: number | null
  depoKod: string
  depoId: number | null
  malzemeId: number | null
  malzemeKod: string
  malzemeAd: string
  olcuBirimi: string
  miktar: number
  kkGiren: number
  bekleyen: number
}

const emptyKalem = (): KalemRow => ({
  key: Math.random().toString(36).slice(2),
  kalemId: null,
  barkod: '',
  topNo: null,
  irsaliyeNo: '',
  irsaliyeKalemId: null,
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

export default function KaliteKontrolKarti({ id: propId, onDeleted, active = true, onKirliChange }: KKFormProps) {
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
  const [cariHesapId, setCariHesapId] = useState<number | null>(null)
  const [cariAd, setCariAd] = useState<string>('')
  const [belgeAdi, setBelgeAdi] = useState<string>('')
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
  const [bekleyenOpen, setBekleyenOpen] = useState(false)
  const [bekleyenYukleniyor, setBekleyenYukleniyor] = useState(false)
  const [bekleyenRows, setBekleyenRows] = useState<BekleyenRow[]>([])
  const [bekleyenSecili, setBekleyenSecili] = useState<BekleyenRow[]>([])
  const [aktariliyor, setAktariliyor] = useState(false)

  // Kaydedilmemiş değişiklik: fisNo/cariAd/depoKod/siparisNo salt-okunur veya türev.
  const { kirli, temizle } = useKirli([fisTarihi, cariHesapId, depoKod, depoId, isEmriId, belgeAdi, aciklama, kalemler])

  useEffect(() => {
    onKirliChange?.(kirli)
  }, [kirli, onKirliChange])
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
          setBelgeAdi(f.belgeAdi ?? '')
          setCariHesapId(f.cariHesapId ?? null)
          setCariAd(f.cariHesap?.ad ?? '')
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
              kalemId: k.id ?? null,
              barkod: k.barkod ?? '',
              topNo: k.topNo ?? null,
              irsaliyeNo: k.irsaliyeKalem?.irsaliye?.irsaliyeNo ?? '',
              irsaliyeKalemId: k.irsaliyeKalemId ?? null,
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
        .finally(() => {
          setLoading(false)
          temizle()
        })
    } else {
      setId(null)
      setStokFisId(null)
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
      temizle()
    }
  }, [propId, temizle])

  const addKalem = async (fromRow?: KalemRow) => {
    const newRow = emptyKalem()
    if (fromRow && fromRow.malzemeKod) {
      newRow.malzemeId = fromRow.malzemeId
      newRow.malzemeKod = fromRow.malzemeKod
      newRow.malzemeAd = fromRow.malzemeAd
      newRow.isEmriNo = fromRow.isEmriNo
      newRow.isEmriId = fromRow.isEmriId
      newRow.isEmriKg = fromRow.isEmriKg
      // Satır kopyalandığında kaynak 11 kalemi bağı korunur (1 irsaliye kalemi → N top).
      newRow.irsaliyeKalemId = fromRow.irsaliyeKalemId
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

  const loadBekleyen = useCallback(async () => {
    setBekleyenYukleniyor(true)
    try {
      const [irsaliyeler, kkList] = await Promise.all([irsaliyeApi.list(), kaliteKontrolApi.list()])
      const kkGiren = new Map<number, number>()
      for (const f of kkList) {
        for (const k of f.kalemler ?? []) {
          if (k.irsaliyeKalemId == null) continue
          const onceki = kkGiren.get(k.irsaliyeKalemId) ?? 0
          const m = Number(k.netAgirlik) > 0 ? Number(k.netAgirlik)
            : Number(k.netMetre) > 0 ? Number(k.netMetre)
            : k.adet || 0
          kkGiren.set(k.irsaliyeKalemId, onceki + m)
        }
      }
      const rows: BekleyenRow[] = []
      for (const i of irsaliyeler) {
        if (String(i.irsaliyeTipi) !== '11') continue
        if (!i.tamamlandi) continue
        for (const k of i.kalemler ?? []) {
          if (k.id == null) continue
          if (k.kaliteYapilmayacak) continue
          const miktar = kalemMiktari(
            k.olcuBirimi,
            Number(k.brutAgirlik) || 0,
            Number(k.netAgirlik) || 0,
            Number(k.brutMetre) || 0,
            Number(k.netMetre) || 0,
            Number(k.adet) || 0,
          )
          if (miktar <= 0) continue
          const giren = kkGiren.get(k.id) ?? 0
          const bekleyen = miktar - giren
          if (bekleyen <= 0) continue
          rows.push({
            key: `${i.id}-${k.id}`,
            irsaliyeKalemId: k.id,
            fisNo: i.irsaliyeNo,
            tarih: new Date(i.irsaliyeTarihi ?? '').toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            cariAd: i.cariHesap?.ad ?? '',
            cariHesapId: i.cariHesapId ?? null,
            depoKod: i.depo?.kod ?? '',
            depoId: i.depoId ?? null,
            malzemeId: k.malzemeId ?? null,
            malzemeKod: k.malzeme?.kod ?? '',
            malzemeAd: k.malzeme?.ad ?? '',
            olcuBirimi: k.olcuBirimi ?? 'kg',
            miktar,
            kkGiren: giren,
            bekleyen,
          })
        }
      }
      setBekleyenRows(rows)
      setBekleyenSecili([])
    } catch {
      setBekleyenRows([])
    } finally {
      setBekleyenYukleniyor(false)
    }
  }, [])

  const handleBekleyenAc = useCallback(() => {
    setBekleyenOpen(true)
    loadBekleyen()
  }, [loadBekleyen])

  const handleBekleyenAktar = useCallback(async () => {
    if (bekleyenSecili.length === 0) {
      message.warning('KK fişine aktarılacak kalem seçiniz')
      return
    }
    if (!depoKod) {
      message.error('Önce depo seçiniz — top barkodu üretilemez')
      return
    }
    setAktariliyor(true)
    try {
      let barkod = (await kaliteKontrolApi.nextBarkod(depoKod)).barkod
      const existing = new Set(kalemler.map((k) => k.barkod).filter(Boolean))
      const yeni: KalemRow[] = []
      for (const r of bekleyenSecili) {
        while (existing.has(barkod)) barkod = incrementBarkod(barkod)
        const birim = String(r.olcuBirimi ?? '').toLowerCase()
        const row = emptyKalem()
        row.barkod = barkod
        row.irsaliyeKalemId = r.irsaliyeKalemId
        row.malzemeId = r.malzemeId
        row.malzemeKod = r.malzemeKod
        row.malzemeAd = r.malzemeAd
        if (birim === 'kg' || birim === 'brutkg') row.kg = r.bekleyen
        else if (birim === 'mt' || birim === 'brutmt') row.mt = r.bekleyen
        else if (birim === 'adet') row.adet = r.bekleyen
        existing.add(barkod)
        barkod = incrementBarkod(barkod)
        yeni.push(row)
      }
      setKalemler((prev) => [...prev, ...yeni])
      setBekleyenOpen(false)
      message.success(`${yeni.length} kalem eklendi`)
    } catch (err) {
      message.error('Aktarılırken hata: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setAktariliyor(false)
    }
  }, [bekleyenSecili, depoKod, kalemler, message])

  const bekleyenColumns = useMemo<ColDef<BekleyenRow>[]>(() => [
    { headerName: 'Fiş No', field: 'fisNo', width: 100, cellClass: '!text-[#f57c00] !font-medium' },
    { headerName: 'Tarih', field: 'tarih', width: 100 },
    { headerName: 'Cari Hesap', field: 'cariAd', flex: 1, minWidth: 140, valueFormatter: (p) => p.value || '-' },
    { headerName: 'Depo', field: 'depoKod', width: 90, valueFormatter: (p) => p.value || '-' },
    { headerName: 'Malzeme Kodu', field: 'malzemeKod', width: 110, valueFormatter: (p) => p.value || '-' },
    { headerName: 'Malzeme Adı', field: 'malzemeAd', flex: 1, minWidth: 150, valueFormatter: (p) => p.value || '-' },
    { headerName: 'Birim', field: 'olcuBirimi', width: 80, valueFormatter: (p) => p.value || '-' },
    { headerName: 'Miktar', field: 'miktar', width: 100, type: 'rightAligned', valueFormatter: (p) => (Number(p.value) || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 }) },
    { headerName: "KK'dan Giren", field: 'kkGiren', width: 110, type: 'rightAligned', valueFormatter: (p) => (Number(p.value) || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 }) },
    { headerName: 'Bekleyen', field: 'bekleyen', width: 110, type: 'rightAligned', cellClass: '!font-semibold !text-[#f57c00]', valueFormatter: (p) => (Number(p.value) || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 }) },
  ], [])

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

  const handleKaydet = async (): Promise<number | null> => {
    setSaving(true)
    try {
      const kalemPayload = kalemler
        .filter((k) => k.malzemeKod)
        .map((k) => ({
          // Mevcut satırın DB id'si: güncellemede id ile eşleşip kalem id'si korunur.
          id: k.kalemId ?? null,
          barkod: k.barkod || null,
          topNo: k.topNo ?? null,
          // Kaynak 11 kalemi bağı (kalite bekleyen listesinden aktarımda gelir).
          irsaliyeKalemId: k.irsaliyeKalemId ?? null,
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

      let kaydedilenId = id
      if (id) {
        await kaliteKontrolApi.update(id, data as any)
        message.success('Güncellendi')
      } else {
        const created = await kaliteKontrolApi.create(data as any)
        setId(created.id)
        kaydedilenId = created.id
        message.success('Kaydedildi')
      }
      // Sunucu yeni top satırlarına topNo atar → grid'i yeniden yüklemeden senkronla.
      const guncel = await kaliteKontrolApi.get(kaydedilenId as number).catch(() => null)
      if (guncel?.kalemler) {
        setKalemler((prev) =>
          prev.map((k) => {
            const es = guncel.kalemler?.find((g) => g.barkod && g.barkod === k.barkod)
            if (!es) return k
            if (es.topNo === k.topNo && es.id === k.kalemId) return k
            return { ...k, kalemId: es.id ?? k.kalemId, topNo: es.topNo ?? null }
          }),
        )
      }
      // Senkron bittikten sonra temizle (kalemler referansı değişmiş olur).
      temizle()
      return kaydedilenId as number
    } catch (err: any) {
      message.error('Hata: ' + (err?.message || err))
      return null
    } finally {
      setSaving(false)
    }
  }

  /**
   * Barkod yazdırma onayı (F10 / sağ tık). Fiş kaydedilmemişse önce kaydeder,
   * ardından o satırın top barkod etiketini yazdırır.
   */
  const openPrintOnay = (row: KalemRow | null | undefined) => {
    if (!row || !row.malzemeKod) {
      message.warning('Önce bir satır seçin')
      return
    }
    if (!row.barkod) {
      message.warning('Bu satırda barkod yok — önce depo seçip satırı kaydedin')
      return
    }
    const kaydedilecek = id == null
    modal.confirm({
      title: 'Barkod Yazdır',
      content: (
        <div className="!text-[12px] !flex !flex-col !gap-1">
          <div>
            Barkod: <span className="!font-semibold !tabular-nums">{row.barkod}</span>
          </div>
          <div>
            Malzeme: {row.malzemeKod} {row.malzemeAd}
          </div>
          {kaydedilecek && (
            <div className="!mt-1 !text-[#f57c00]">
              Fiş henüz kaydedilmedi — yazdırmadan önce kaydedilecek.
            </div>
          )}
        </div>
      ),
      okText: kaydedilecek ? 'Kaydet ve Barkod Yazdır' : 'Barkod Yazdır',
      cancelText: 'Vazgeç',
      onOk: async () => {
        let hedef = row
        if (id == null) {
          const savedId = await handleKaydet()
          if (savedId == null) return
          // Sunucu yeni satırlara topNo atar → güncel satırı bul (barkod tekil).
          const guncel = await kaliteKontrolApi.get(savedId).catch(() => null)
          const eslesen = guncel?.kalemler?.find((k) => k.barkod === row.barkod)
          if (eslesen) {
            hedef = { ...row, topNo: eslesen.topNo ?? row.topNo }
          }
        }
        const sablon = await etiketSablonGetir(hedef.barkod)
        if (!sablon) message.info('Etiket şablonu bulunamadı — varsayılan etiket basılıyor')
        await directPrint(hedef, sablon)
      },
    })
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

  // Etiket tasarımı: Şablonlar ekranındaki "Etiket" (ekranAdi='etiket') aktif şablon.
  // Yoksa koddaki varsayılan etikete düşer.
  const [etiketSablon, setEtiketSablon] = useState<Sablon | null>(null)

  /**
   * Aktif "Etiket" şablonunu her basımda yeniden çeker (tasarım kaydedildikten sonra
   * fişi kapatıp açmaya gerek kalmasın). Aktif yoksa null → varsayılan etiket.
   */
  const etiketSablonGetir = useCallback(async (barkod?: string | null): Promise<Sablon | null> => {
    try {
      const liste = (await sablonApi.list('etiket')).filter((s) => s.aktif)
      if (liste.length === 0) return null
      // 1) Barkod ön ekine göre en uzun eşleşme (ör. YM / HM ayrı tasarım)
      let secili: Sablon | undefined
      if (barkod) {
        secili = liste
          .filter((s) => s.barkodOneki && barkod.toUpperCase().startsWith(s.barkodOneki.trim().toUpperCase()))
          .sort((a, b) => (b.barkodOneki?.length ?? 0) - (a.barkodOneki?.length ?? 0))[0]
      }
      // 2) Genel (öneki boş) şablon
      if (!secili) secili = liste.filter((s) => !s.barkodOneki).sort((a, b) => b.id - a.id)[0]
      // 3) Hiçbiri yoksa en yeni aktif
      if (!secili) secili = liste.sort((a, b) => b.id - a.id)[0]
      const tam = secili ? await sablonApi.get(secili.id) : null
      if (!tam?.htmlIcerik) return null
      setEtiketSablon(tam)
      return tam
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    etiketSablonGetir()
  }, [etiketSablonGetir])

  const htmlKacis = (v: unknown) =>
    String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')

  /** Satır verisini şablon yer tutucularına ({{\s*anahtar\s*}}) bağlar. */
  const etiketHtml = (row: KalemRow, sablon: Sablon | null) => {
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
    const hataOzet = row.hatalar.length > 0
      ? row.hatalar.map((h) => `${h.hataAdi} ${h.miktar ?? 1}`).join(', ')
      : ''

    if (!sablon?.htmlIcerik) return null

    const degerler: Record<string, string> = {
      barkod: htmlKacis(row.barkod),
      barkod_img: barkodSvg,
      top_no: row.topNo != null ? String(row.topNo) : '',
      fis_no: htmlKacis(row.irsaliyeNo),
      kk_fis_no: htmlKacis(fisNo),
      malzeme_kod: htmlKacis(row.malzemeKod),
      malzeme_ad: htmlKacis(row.malzemeAd),
      kg: htmlKacis(fmt(row.kg)),
      mt: htmlKacis(fmt(row.mt)),
      adet: row.adet ? htmlKacis(row.adet) : '',
      hatalar: row.hatalar
        .map((h) => `▸ ${htmlKacis(h.hataKodu)} ${htmlKacis(h.hataAdi)}${h.miktar ? ` x${h.miktar}` : ''}`)
        .join('<br>'),
      hata_ozet: htmlKacis(hataOzet),
      aciklama: htmlKacis(row.aciklama),
      depo: htmlKacis(depoKod),
      tarih: fisTarihi.format('DD.MM.YYYY'),
      kullanici: htmlKacis(kayitYapan),
      is_emri: htmlKacis(isEmriKod),
      siparis: htmlKacis(siparisNo),
    }

    return sablon.htmlIcerik.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (tam, anahtar: string) => {
      const k = anahtar.startsWith('kk.') ? anahtar.slice(3) : anahtar
      return degerler[k] ?? tam
    })
  }

  const directPrint = async (row: KalemRow, sablonArg?: Sablon | null) => {
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
      <div>Top No  : ${row.topNo ?? '-'}</div>
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

    // Yazdırmayı açan pencereden DEĞİL, açılan pencerenin kendisinden tetikle:
    // window.print() senkron olduğu için açan sekmeyi kilitliyordu (iptalde donma).
    // afterprint: yazdır veya iptal sonrası pencere kendini kapatır.
    const yazdirScript = `<script>
      window.addEventListener('load', function () { setTimeout(function () { window.focus(); window.print() }, 300) });
      window.addEventListener('afterprint', function () { setTimeout(function () { window.close() }, 150) });
    </script>`

    // Şablonlar ekranındaki "Etiket" tasarımı varsa onu bas.
    const sablon = sablonArg ?? etiketSablon
    // Şablon sorgusu varsa SQL'den gerçek veriyle doldur ({{barkod.siparis_no}} vb.);
    // yoksa/başarısızsa satırdaki alanlarla ({{barkod}}, {{kg}}...) doldur.
    let sablonHtml: string | null = null
    if (sablon) {
      if (sablon.sorgular && sablon.sorgular.length > 0 && row.kalemId != null) {
        try {
          const sonuc = await sablonApi.onerizle(sablon.id, { id: row.kalemId })
          if (sonuc?.html) sablonHtml = sonuc.html
        } catch {
          /* SQL hatası → satır alanlarına düş */
        }
      }
      if (!sablonHtml) sablonHtml = etiketHtml(row, sablon)
    }
    if (sablonHtml) {
      let en = sablon?.sayfaEn ?? 90
      let boy = sablon?.sayfaBoy ?? 130
      // Yatay şablonda ölçüleri çevir (etiket yönü).
      if (sablon?.yon === 'yatay' && en < boy) {
        const t = en
        en = boy
        boy = t
      }
      const ust = sablon?.ustBosluk ?? 0
      const alt = sablon?.altBosluk ?? 0
      const sol = sablon?.solBosluk ?? 0
      const sag = sablon?.sagBosluk ?? 0
      w.document.write(`<html><head><title>Etiket</title><style>
        @page{margin:0;size:${en}mm ${boy}mm}
        html,body{margin:0;padding:0;width:${en}mm;height:${boy}mm;overflow:hidden;
                  -webkit-print-color-adjust:exact;print-color-adjust:exact}
        body{box-sizing:border-box;padding:${ust}mm ${sag}mm ${alt}mm ${sol}mm;
             font-family:Arial,Helvetica,sans-serif;color:#000}
        body *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        body>*{max-width:100%}
        table{max-width:100%;border-collapse:collapse}
        img,svg{max-width:100%;height:auto}
      </style></head><body>${sablonHtml}${yazdirScript}</body></html>`)
      w.document.close()
      return
    }

    w.document.write(`<html><head><title>Etiket</title><style>@page{margin:0;size:100mm 150mm}body{margin:0}</style></head><body>${html}${yazdirScript}</body></html>`)
    w.document.close()
  }

  const gridApiRef = useRef<GridApi<KalemRow> | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Kısayollar yalnızca bu kartın sekmesi aktifken çalışsın (diğer sekmelerde sussun).
      if (!active) return
      const target = e.target as HTMLElement
      // F10, hücre düzenlenirken de çalışmalı (kg girip hemen yazdırma akışı).
      if (e.key === 'F10') {
        e.preventDefault()
        const idx = focusedRowIndexRef.current
        if (idx != null && idx >= 0 && idx < kalemler.length) {
          openPrintOnay(kalemler[idx])
        } else {
          message.warning('Önce bir satır seçin')
        }
        return
      }
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
      if (e.ctrlKey && !e.shiftKey && !e.altKey && (e.key === 'H' || e.key === 'h')) {
        e.preventDefault()
        const idx = focusedRowIndexRef.current
        if (idx != null && idx >= 0 && idx < kalemler.length) {
          openHataModal(kalemler[idx])
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [active, kalemler, message, openPrintOnay])

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
      headerName: 'Top No', field: 'topNo', width: 80, type: 'rightAligned',
      cellRenderer: (p: { data: KalemRow }) => (
        <div className="!h-full !flex !items-center !justify-end !px-2 !text-[12px] !font-semibold !text-[#f57c00]">
          {p.data.topNo ?? ''}
        </div>
      ),
    },
    {
      headerName: '11 Fiş No', field: 'irsaliyeNo', width: 100,
      cellRenderer: (p: { data: KalemRow }) => (
        <div className="!h-full !flex !items-center !px-2 !text-[12px] !text-[#f57c00]">
          {p.data.irsaliyeNo || '—'}
        </div>
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
          save: { accent: kirli },
          delete: { onClick: handleSil, label: 'Sil', disabled: !id, danger: true },
        })}
      />
      <div className="!flex-1 !min-h-0 !flex !flex-col !px-3 !overflow-hidden">
        <div className="!flex-shrink-0 !space-y-1.5">
          <div className="!flex !gap-2">
            <div className="!shrink-0 !border !border-gray-200 !rounded-sm !p-2">
              <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-1">Genel Bilgiler</div>
              <div className="!space-y-0.5">
                <div className="!flex !items-center !gap-3">
                  <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">Fiş Tarihi</div>
                  <DatePicker size="small" value={fisTarihi} onChange={(d) => d && setFisTarihi(d)} format="DD.MM.YYYY" placeholder="Fiş tarihi" className="!w-48 !text-[12px]" />
                </div>
                <div className="!flex !items-center !gap-3">
                  <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">Cari Hesap</div>
                  <div className="!text-[12px] !text-[#111] !w-48 !truncate" title={cariAd || undefined}>
                    {cariAd ? cariAd.trim().split(/\s+/)[0] : '—'}
                  </div>
                </div>
                <div className="!flex !items-center !gap-3">
                  <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">Belge No</div>
                  <div className="!text-[12px] !text-[#111] !w-48">{belgeAdi || '—'}</div>
                </div>
              </div>
            </div>

            <div className="!flex-1 !border !border-gray-200 !rounded-sm !p-2">
              <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-1">Depo Bilgileri</div>
              <div className="!flex !items-start !gap-6">
                <div className="!flex !items-center !gap-3">
                  <div className="!text-[12px] !text-[red] !w-24 !shrink-0">Depo</div>
                  <SearchableDepoSelect value={depoKod} onChange={(kod, rec) => { setDepoKod(kod); setDepoId(kod ? (rec as any)?.id ?? null : null) }} />
                </div>
                <div className="!border-l !border-gray-200 !pl-6">
                  <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-1">Diğer Bilgiler</div>
                  <div className="!flex !items-center !gap-3">
                    <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">İş Emirleri</div>
                    <Button size="small" type="default" onClick={() => setIsEmriModalOpen(true)} className="!text-[11px]">
                      Seç
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="!border !border-gray-200 !rounded-sm !flex-1 !min-h-0 !flex !flex-col !mt-1.5">
          <div className="!flex !items-center !justify-between !px-3 !pt-2 !pb-1 !flex-shrink-0">
            <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide">Satır Detayları</div>
            <div className="!flex !items-center !gap-1">
              <Button size="small" type="default" icon={<InboxOutlined />} onClick={handleBekleyenAc} className="!text-[12px]">
                Kalite Bekleyen
              </Button>
              <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={addKalem} className="!text-[12px]">
                Satır Ekle
              </Button>
            </div>
          </div>
          <div style={{ height: 220, width: '100%' }} className="kalemler-grid">
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'yazdir',
                    label: 'Barkod Yazdır (F10)',
                    onClick: () => {
                      const idx = focusedRowIndexRef.current
                      openPrintOnay(idx != null ? kalemler[idx] : null)
                    },
                  },
                  {
                    key: 'hatalar',
                    label: 'Hatalar (Ctrl+H)',
                    onClick: () => {
                      const idx = focusedRowIndexRef.current
                      if (idx != null && idx >= 0 && idx < kalemler.length) openHataModal(kalemler[idx])
                      else message.warning('Önce bir satır seçin')
                    },
                  },
                  { type: 'divider' },
                  { key: 'stogaAl', label: 'Stoğa Al', disabled: !id || !!stokFisId, onClick: handleStogaAl },
                ],
              }}
              trigger={['contextMenu']}
            >
              <div style={{ height: '100%', width: '100%' }}>
                <AgGridReact
                  style={{ height: '100%' }}
                  rowData={kalemler}
                  columnDefs={kolonDefs}
                  theme={antTheme}
                  headerHeight={32}
                  rowHeight={30}
                  rowSelection={{ mode: 'singleRow', enableClickSelection: true }}
                  getRowId={(p) => p.data.key}
                  localeText={agGridLocaleTR}
                  defaultColDef={{ resizable: true, sortable: true }}
                  onGridReady={(e) => { gridApiRef.current = e.api }}
                  onCellContextMenu={(e: CellContextMenuEvent<KalemRow>) => {
                    if (e.data && e.node?.rowIndex != null) {
                      focusedRowIndexRef.current = e.node.rowIndex
                      e.node.setSelected(true)
                    }
                  }}
                  onCellKeyDown={async (e: any) => {
                    if (e.event?.key !== 'ArrowDown') return
                    const rowIndex = e.node?.rowIndex
                    if (rowIndex == null) return
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
                  Adet: <span className="!font-semibold !tabular-nums">{toplamAdet}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <IsEmriSecimiModal
        open={isEmriModalOpen}
        onClose={() => setIsEmriModalOpen(false)}
        onSelect={handleIsEmriSecimi}
      />

      <Modal
        open={bekleyenOpen}
        onCancel={() => setBekleyenOpen(false)}
        width="90vw"
        title={<span className="!text-[13px] !font-semibold">Kalite Bekleyen — 11-Fasondan Giriş kalemleri</span>}
        footer={[
          <Button key="vazgec" onClick={() => setBekleyenOpen(false)} className="!text-[12px]">
            Vazgeç
          </Button>,
          <Button
            key="aktar"
            type="primary"
            loading={aktariliyor}
            onClick={handleBekleyenAktar}
            className="!text-[12px]"
          >
            Seçilenleri Satır Olarak Ekle
          </Button>,
        ]}
      >
        <Spin spinning={bekleyenYukleniyor}>
          <div className="!flex !flex-col !gap-2">
            <div className="!text-[11px] !text-[#9ca3af]">
              11-Fasondan Giriş fişlerinden gelen, kalite kontrol gerekmiyor işareti
              olmayan ve henüz kalite kontrol girişine girmemiş kalemler. Seçip karta satır olarak ekleyin.
            </div>
            <div style={{ height: 400 }}>
              <DataGrid
                rowData={bekleyenRows}
                columnDefs={bekleyenColumns}
                domLayout="normal"
                exportFileName="kalite-bekleyen"
                storageKey="kaliteBekleyen"
                height={400}
                enableRowSelection
                onSelectionChanged={(e: SelectionChangedEvent<BekleyenRow>) => {
                  setBekleyenSecili(e.api.getSelectedRows())
                }}
              />
            </div>
          </div>
        </Spin>
      </Modal>
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
