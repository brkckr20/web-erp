'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import dayjs from 'dayjs'
import { Tabs, Input, Select, DatePicker, Button, App, Spin, Popconfirm, Tooltip } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import SearchableCariSelect from '@/components/shared/SearchableCariSelect'
import DataGrid from '@/components/shared/DataGrid'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import SearchableMalzemeSelect from '@/components/shared/SearchableMalzemeSelect'
import SearchableRenkSelect from '@/components/shared/SearchableRenkSelect'
import { malzemeFiyatApi } from '@/lib/malzeme-fiyat-api'
import { dovizApi } from '@/lib/doviz-api'
import { modelBedenApi, type ModelBeden } from '@/lib/model-beden-api'
import { modelKumasGrupApi, type ModelKumasGrup } from '@/lib/model-kumas-grup-api'
import { useAuth } from '@/context/AuthContext'
import type { ColDef, CellValueChangedEvent, RowClickedEvent } from 'ag-grid-community'

const NUMARATOR_PREFIXES = ['IH', 'TR', 'KS', 'NS', 'MS'] as const
type NumaratorPrefix = typeof NUMARATOR_PREFIXES[number]

interface ModelRow {
  key: string
  malzemeId?: number
  modelKod: string
  modelAd: string
  aciklama: string
  ozelKod: string
  dovizCinsi: string
  dovizFiyat: string
  dovizKuru: string
  fiyat: string
}

interface RenkBedenVaryant {
  renkId: number | null
  renkAd: string
  renkHex: string
}

interface RenkBedenRow {
  key: string
  renkler: Record<number, RenkBedenVaryant>
  fiyatlar: Record<number, string>
  ozelKod: string
  musteriOrderNo: string
  partOrderNo: string
  aciklama: string
  istemeTarih: string
  fiyat: string
  kesimUretim: string
  lot: string
  miktarlar: Record<number, string>
  lotToplami: string
  toplam: string
  genelToplam: string
}

const STORAGE_KEY = 'siparis_counter'

function getNextSiparisNo(prefix: NumaratorPrefix): string {
  const year = new Date().getFullYear().toString().slice(-2)
  const key = `${prefix}-${year}`
  const raw = localStorage.getItem(STORAGE_KEY)
  const counters: Record<string, number> = raw ? JSON.parse(raw) : {}
  const next = (counters[key] ?? 0) + 1
  counters[key] = next
  localStorage.setItem(STORAGE_KEY, JSON.stringify(counters))
  return `${prefix}${year}-${String(next).padStart(4, '0')}`
}

interface SiparisFormData {
  siparisNo: string
  musteriOrderNo: string
  prefix: NumaratorPrefix | null
  tarih: string
  cariKod: string
  istemeTarih: string
  mIstemeTarih: string
  kesimFazlasi: string
  musteriTemsilcisi: string
}

const emptyData: SiparisFormData = {
  siparisNo: '',
  musteriOrderNo: '',
  prefix: null,
  tarih: new Date().toISOString().slice(0, 10),
  cariKod: '',
  istemeTarih: new Date().toISOString().slice(0, 10),
  mIstemeTarih: new Date().toISOString().slice(0, 10),
  kesimFazlasi: '',
  musteriTemsilcisi: '',
}

interface SiparisKartiProps {
  isNew?: boolean
  id?: number
}

export default function SiparisKarti({ isNew, id }: SiparisKartiProps) {
  const { message } = App.useApp()
  const { kullanici } = useAuth()
  const kayitYapan = kullanici ? `${kullanici.kod} - ${kullanici.ad}` : ''
  const [form, setForm] = useState<SiparisFormData>(emptyData)
  const [rows, setRows] = useState<ModelRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [dovizOptions, setDovizOptions] = useState<{ value: string; label: string }[]>([])
  const [aciklamaTip, setAciklamaTip] = useState<string>('genel')
  const [aciklamaMetin, setAciklamaMetin] = useState('')
  const [selectedModelKey, setSelectedModelKey] = useState<string | null>(null)
  const [modelBedenler, setModelBedenler] = useState<ModelBeden[]>([])
  const [kumasGruplari, setKumasGruplari] = useState<ModelKumasGrup[]>([])
  const [renkBedenRows, setRenkBedenRows] = useState<RenkBedenRow[]>([])
  const lastLoadedRef = useRef<{ key: string; malzemeId: number | undefined } | null>(null)

  const aciklamaTipleri = [
    { value: 'genel', label: 'Genel Açıklamalar' },
    { value: 'kesim', label: 'Kesim Açıklamaları' },
    { value: 'paket', label: 'Paket Açıklamaları' },
  ]

  const emptyRow = (key: string): ModelRow => ({ key, malzemeId: undefined, modelKod: '', modelAd: '', aciklama: '', ozelKod: '', dovizCinsi: '', dovizFiyat: '', dovizKuru: '', fiyat: '' })

  const emptyRenkBedenRow = (gruplar: ModelKumasGrup[], bedenler: ModelBeden[]): RenkBedenRow => {
    const renkler: Record<number, RenkBedenVaryant> = {}
    for (const g of gruplar) {
      renkler[g.kumasGrupId] = { renkId: null, renkAd: '', renkHex: '' }
    }
    const miktarlar: Record<number, string> = {}
    for (const b of bedenler) {
      miktarlar[b.bedenId] = ''
    }
    const fiyatlar: Record<number, string> = {}
    for (const b of bedenler) {
      fiyatlar[b.bedenId] = ''
    }
    return {
      key: Date.now().toString() + Math.random().toString(36).slice(2),
      renkler,
      fiyatlar,
      ozelKod: '',
      musteriOrderNo: '',
      partOrderNo: '',
      aciklama: '',
      istemeTarih: '',
      fiyat: '',
      kesimUretim: '',
      lot: '',
      miktarlar,
      lotToplami: '',
      toplam: '',
      genelToplam: '',
    }
  }

  const removeRow = (key: string) =>
    setRows((prev) => prev.filter((r) => r.key !== key))

  const DEFAULTS = [
    { value: 'TL', label: 'TL' },
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'GBP', label: 'GBP' },
    { value: 'CHF', label: 'CHF' },
  ]

  useEffect(() => {
    dovizApi.list().then((list) => {
      const active = list.filter((d) => d.kullanimda).sort((a, b) => a.sira - b.sira)
      setDovizOptions(active.length > 0 ? active.map((d) => ({ value: d.kod, label: `${d.kod}${d.ad ? ' - ' + d.ad : ''}` })) : DEFAULTS)
    }).catch(() => setDovizOptions(DEFAULTS))
  }, [])

  useEffect(() => {
    if (id && !isNew) {
      loadById(id)
    } else {
      setForm({ ...emptyData, musteriTemsilcisi: kayitYapan })
    }
  }, [id, isNew])

  const loadById = async (_id: number) => {
    setLoading(true)
    try {
      setForm(emptyData)
    } catch {
      message.warning('Sipariş bulunamadı')
    } finally {
      setLoading(false)
    }
  }

  const handlePrefixChange = (prefix: NumaratorPrefix) => {
    const siparisNo = getNextSiparisNo(prefix)
    setForm((prev) => ({ ...prev, prefix, siparisNo }))
    setIsDirty(true)
  }

  const handleCariChange = (kod: string) => {
    setForm((prev) => ({ ...prev, cariKod: kod }))
    setIsDirty(true)
  }

  const modelColumns = useMemo<ColDef<ModelRow>[]>(
    () => [
      {
        headerName: '', field: 'key', width: 40, minWidth: 40, maxWidth: 40,
        resizable: false, sortable: false, filter: false, cellClass: '!p-0',
        cellRenderer: (p: { data: ModelRow }) => (
          <div className="!flex !items-center !justify-center !h-full">
            <Popconfirm
              title="Satırı sil"
              description="Bu satırı silmek istediğinize emin misiniz?"
              okText="Evet, sil"
              cancelText="Vazgeç"
              okButtonProps={{ danger: true, size: 'small' }}
              cancelButtonProps={{ size: 'small' }}
              placement="right"
              onConfirm={() => removeRow(p.data.key)}
            >
              <Tooltip title="Satır Sil">
                <Button type="text" danger size="small" icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </div>
        ),
      },
      {
        headerName: 'Model Kodu',
        field: 'modelKod',
        width: 140,
        minWidth: 120,
        cellClass: '!p-0',
        cellRenderer: (p: { data: ModelRow }) => (
          <SearchableMalzemeSelect
            value={p.data.modelKod}
            tip={5}
            widthClass="!w-full"
            className="!w-full !h-full !text-[12px]"
            onChange={async (kod, rec) => {
              let dovizCinsi = ''
              let dovizFiyat = ''
              let dovizKuru = ''
              let fiyat = ''
              if (rec?.id) {
                try {
                  const fiyatlar = await malzemeFiyatApi.list(rec.id)
                  const aktifFiyat = fiyatlar
                    .filter((f) => f.kullanimda !== false)
                    .sort((a, b) => {
                      const da = a.tarih ? new Date(a.tarih).getTime() : 0
                      const db = b.tarih ? new Date(b.tarih).getTime() : 0
                      return db - da
                    })[0]
                  if (aktifFiyat) {
                    dovizCinsi = aktifFiyat.dovizCinsi ?? ''
                    dovizFiyat = aktifFiyat.fiyat?.toString() ?? ''
                    dovizKuru = aktifFiyat.dovizKuru?.toString() ?? ''
                    const f = aktifFiyat.fiyat ?? 0
                    const kur = aktifFiyat.dovizKuru ?? 1
                    fiyat = (f * kur).toFixed(2)
                  }
                } catch (err) {
                  console.error('Fiyat yüklenirken hata:', err)
                }
              }
              setRows((prev) =>
                prev.map((row) =>
                  row.key === p.data.key
                    ? { ...row, malzemeId: rec?.id, modelKod: kod, modelAd: rec?.ad ?? '', dovizCinsi, dovizFiyat, dovizKuru, fiyat }
                    : row,
                ),
              )
              setIsDirty(true)
              handleModelSelect({
                ...p.data,
                malzemeId: rec?.id,
                modelKod: kod,
                modelAd: rec?.ad ?? '',
                dovizCinsi,
                dovizFiyat,
                dovizKuru,
                fiyat,
              })
            }}
          />
        ),
      } as ColDef<ModelRow>,
      { headerName: 'Model Adı', field: 'modelAd', flex: 1, minWidth: 120, editable: false },
      { headerName: 'Açıklama', field: 'aciklama', flex: 1, minWidth: 100, editable: true },
      { headerName: 'Özel Kod', field: 'ozelKod', width: 100, editable: true, minWidth: 80 },
      { headerName: 'Döviz Cinsi', field: 'dovizCinsi', width: 110, cellClass: '!p-0',
        cellRenderer: (p: { data: ModelRow }) => (
          <Select
            size="small"
            value={p.data.dovizCinsi || undefined}
            onChange={(val) => {
              setRows((prev) =>
                prev.map((row) =>
                  row.key === p.data.key ? { ...row, dovizCinsi: val } : row,
                ),
              )
              setIsDirty(true)
            }}
            variant="borderless"
            className="!w-full !h-full !text-[12px]"
            popupMatchSelectWidth={false}
            options={dovizOptions}
          />
        ),
      },
      { headerName: 'Döviz Fiyat', field: 'dovizFiyat', width: 100, editable: true, minWidth: 80, cellDataType: 'numeric' },
      { headerName: 'Döviz Kuru', field: 'dovizKuru', width: 100, editable: true, minWidth: 80, cellDataType: 'numeric' },
      { headerName: 'Fiyat (TL)', field: 'fiyat', width: 100, editable: true, minWidth: 80, cellDataType: 'numeric' },
    ],
    [],
  )

  const renkBedenColDefs = useMemo<ColDef<RenkBedenRow>[]>(() => {
    const varyantCols: ColDef<RenkBedenRow>[] = kumasGruplari.map((g) => ({
      headerName: g.kumasGrup?.kod ?? `#${g.kumasGrupId}`,
      field: `renkler.${g.kumasGrupId}`,
      width: 200,
      minWidth: 160,
      sortable: false,
      filter: false,
      cellClass: '!p-1 !font-medium',
      cellRenderer: (p: { data: RenkBedenRow }) => {
        const v = p.data.renkler[g.kumasGrupId] ?? { renkId: null, renkAd: '', renkHex: '' }
        return (
          <div className="!flex !items-center !gap-2 !h-full">
            <span
              className="!inline-block !w-3.5 !h-3.5 !rounded-sm !border !border-gray-300 !shrink-0"
              style={{ backgroundColor: v.renkHex || '#fff' }}
            />
            <SearchableRenkSelect
              tip={1}
              value={v.renkId}
              widthClass="!w-[150px]"
              onChange={(id, rec) =>
                updateRenkBedenRow(p.data.key, {
                  renkler: {
                    ...p.data.renkler,
                    [g.kumasGrupId]: { renkId: id, renkAd: rec ? `${rec.kod} - ${rec.ad}` : '', renkHex: rec?.renk ?? '' },
                  },
                })
              }
            />
          </div>
        )
      },
    }))

    const bedenCols: ColDef<RenkBedenRow>[] = modelBedenler.map((b) => ({
      headerName: b.beden.kod,
      field: `miktarlar.${b.bedenId}`,
      width: 70,
      minWidth: 60,
      editable: true,
      cellDataType: 'numeric',
    }))

    return [
      {
        headerName: '', field: 'key', width: 40, minWidth: 40, maxWidth: 40,
        resizable: false, sortable: false, filter: false, cellClass: '!p-0',
        cellRenderer: (p: { data: RenkBedenRow }) => (
          <div className="!flex !items-center !justify-center !h-full">
            <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => removeRenkBedenRow(p.data.key)} />
          </div>
        ),
      },
      ...varyantCols,
      { headerName: 'Özel Kod', field: 'ozelKod', width: 100, editable: true },
      { headerName: 'Müşteri Order No', field: 'musteriOrderNo', width: 130, editable: true },
      { headerName: 'Part Order No', field: 'partOrderNo', width: 110, editable: true },
      { headerName: 'Açıklama', field: 'aciklama', width: 120, editable: true },
      { headerName: 'İsteme Tarihi', field: 'istemeTarih', width: 110, editable: true },
      { headerName: 'Fiyat', field: 'fiyat', width: 90, editable: true, cellDataType: 'numeric' },
      { headerName: 'Kesim/Üretim', field: 'kesimUretim', width: 110, editable: true },
      { headerName: 'Lot', field: 'lot', width: 80, editable: true, cellDataType: 'numeric' },
      ...bedenCols,
      { headerName: 'Lot Toplamı', field: 'lotToplami', width: 100, editable: true, cellDataType: 'numeric' },
      { headerName: 'Toplam', field: 'toplam', width: 90, editable: true, cellDataType: 'numeric' },
      { headerName: 'Genel Toplam', field: 'genelToplam', width: 110, editable: true, cellDataType: 'numeric' },
    ]
  }, [kumasGruplari, modelBedenler])

  const fiyatColDefs = useMemo<ColDef<RenkBedenRow>[]>(() => {
    const bedenFiyatCols: ColDef<RenkBedenRow>[] = modelBedenler.map((b) => ({
      headerName: b.beden.kod,
      field: `fiyatlar.${b.bedenId}`,
      width: 90,
      minWidth: 70,
      editable: true,
      cellDataType: 'numeric',
    }))

    return [
      {
        headerName: 'Renk',
        field: 'key',
        width: 220,
        minWidth: 180,
        sortable: false,
        filter: false,
        cellClass: '!p-1 !font-medium',
        cellRenderer: (p: { data: RenkBedenRow }) => {
          const v = p.data.renkler[Object.keys(p.data.renkler)[0] as unknown as number] ?? { renkAd: '', renkHex: '' }
          return (
            <div className="!flex !items-center !gap-2 !h-full">
              <span
                className="!inline-block !w-3.5 !h-3.5 !rounded-sm !border !border-gray-300 !shrink-0"
                style={{ backgroundColor: v.renkHex || '#fff' }}
              />
              <span className="!text-[11px] !text-[#333]">{v.renkAd || 'Renk seçilmedi'}</span>
            </div>
          )
        },
      },
      ...bedenFiyatCols,
    ]
  }, [modelBedenler])

  const selectedModel = rows.find((r) => r.key === selectedModelKey) ?? null

  const handleYeni = () => {
    setForm({ ...emptyData, musteriTemsilcisi: kayitYapan })
    setRows([])
    setIsDirty(false)
  }

  const handleKaydet = async () => {
    setSaving(true)
    try {
      message.success('Demo kayıt başarılı')
      setIsDirty(false)
    } catch {
      message.error('Kayıt sırasında hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handlePrevious = () => message.info('İlk kayıttasınız')
  const handleNext = () => message.info('Son kayıttasınız')

  const handleSil = () => {
    message.success('Demo silme başarılı')
    handleYeni()
  }

  const handleCellValueChanged = (e: CellValueChangedEvent<ModelRow>) => {
    const field = e.colDef.field as keyof ModelRow
    if (!field) return
    setRows((prev) =>
      prev.map((row) => {
        if (row.key !== e.data.key) return row
        const updated = { ...row, [field]: e.newValue ?? '' }
        if ((field === 'dovizFiyat' || field === 'dovizKuru') && updated.dovizFiyat && updated.dovizKuru) {
          const f = parseFloat(updated.dovizFiyat) || 0
          const k = parseFloat(updated.dovizKuru) || 0
          updated.fiyat = (f * k).toFixed(2)
        }
        return updated
      }),
    )
    setIsDirty(true)
  }

  const handleModelSelect = (row: ModelRow | null) => {
    if (!row) {
      setSelectedModelKey(null)
      setRenkBedenRows([])
      setModelBedenler([])
      setKumasGruplari([])
      lastLoadedRef.current = null
      return
    }
    if (row.key === selectedModelKey && lastLoadedRef.current?.malzemeId === row.malzemeId) return
    setSelectedModelKey(row.key)
    setRenkBedenRows([])
    setModelBedenler([])
    setKumasGruplari([])
    if (!row.malzemeId) {
      setRenkBedenRows([emptyRenkBedenRow([], [])])
      lastLoadedRef.current = { key: row.key, malzemeId: undefined }
      return
    }
    setLoading(true)
    Promise.all([
      modelBedenApi.getByMalzeme(row.malzemeId).catch(() => [] as ModelBeden[]),
      modelKumasGrupApi.getByMalzeme(row.malzemeId!).catch(() => [] as ModelKumasGrup[]),
    ])
      .then(([bedenler, gruplar]) => {
        setModelBedenler(bedenler)
        setKumasGruplari(gruplar)
        setRenkBedenRows([emptyRenkBedenRow(gruplar, bedenler)])
        lastLoadedRef.current = { key: row.key, malzemeId: row.malzemeId }
      })
      .catch(() => {
        message.warning('Model varyant/beden bilgileri yüklenemedi')
        setRenkBedenRows([emptyRenkBedenRow([], [])])
        lastLoadedRef.current = { key: row.key, malzemeId: row.malzemeId }
      })
      .finally(() => setLoading(false))
  }

  const handleModelRowClick = (e: RowClickedEvent<ModelRow>) => {
    if (e.data) handleModelSelect(e.data)
  }

  const handleModelSelectionChanged = (e: { api: { getSelectedRows: () => ModelRow[] } }) => {
    const sel = e.api.getSelectedRows()
    handleModelSelect(sel[0] ?? null)
  }

  const updateRenkBedenRow = (key: string, patch: Partial<RenkBedenRow>) =>
    setRenkBedenRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  const handleRenkBedenCellValueChanged = (e: CellValueChangedEvent<RenkBedenRow>) => {
    const field = e.colDef.field
    if (!field || !field.startsWith('miktarlar.')) return
    const row = e.data
    const toplam = modelBedenler.reduce((sum, b) => {
      const v = parseFloat(row.miktarlar[b.bedenId] ?? '')
      return sum + (Number.isFinite(v) ? v : 0)
    }, 0)
    updateRenkBedenRow(row.key, { genelToplam: toplam > 0 ? String(toplam) : '' })
  }

  const handleFiyatCellValueChanged = (e: CellValueChangedEvent<RenkBedenRow>) => {
    const field = e.colDef.field
    if (!field || !field.startsWith('fiyatlar.')) return
    const row = e.data
    updateRenkBedenRow(row.key, { fiyatlar: { ...row.fiyatlar } })
  }

  const removeRenkBedenRow = (key: string) =>
    setRenkBedenRows((prev) => prev.filter((r) => r.key !== key))

  const toolbarButtons = createToolbarButtons({
    onNew: handleYeni,
    onSave: handleKaydet,
    onPrevious: handlePrevious,
    onNext: handleNext,
    onDelete: handleSil,
  })

  return (
    <div className="!h-full !flex !flex-col">
      <div className="!bg-white !border !border-gray-200 !rounded-sm !flex-1 !flex !flex-col !overflow-hidden">
        <CardToolbar buttons={toolbarButtons} />
        <Spin spinning={loading} classNames={{ root: "!flex-1 !flex !flex-col !min-h-0" }}>
          {/* Üst tab grubu – Genel / Detay, içeriği kadar yer kaplar */}
          <Tabs
            defaultActiveKey="genel"
            size="small"
            tabBarGutter={2}
            className="!flex-shrink-0 !px-3 !pt-2 [&_.ant-tabs-nav]:!mb-[2px] [&_.ant-tabs-nav]:!border-b [&_.ant-tabs-nav]:!border-gray-200 [&_.ant-tabs-tab]:!text-[11px] [&_.ant-tabs-tab]:!px-2 [&_.ant-tabs-tab]:!py-1 [&_.ant-tabs-tab]:!bg-[#E0E0E0] [&_.ant-tabs-tab]:!border [&_.ant-tabs-tab]:!border-gray-200 [&_.ant-tabs-tab]:!text-[#333] [&_.ant-tabs-tab-active]:!bg-white [&_.ant-tabs-tab-active]:!border-t-2 [&_.ant-tabs-tab-active]:!border-t-[#FF9933] [&_.ant-tabs-tab-active]:!text-[#FF9933] [&_.ant-tabs-ink-bar]:!hidden"
            items={[
              {
                key: 'genel',
                label: 'Genel',
                children: (
                  <div className="!w-full">
                    <div className="!border !border-gray-200 !rounded-sm !p-2">
                      <div className="!flex !items-center !gap-2">
                        <label className="!text-[10px] !font-semibold !uppercase !w-28 !text-right !shrink-0">Numaratör</label>
                        <Select
                          size="small"
                          placeholder="Seçiniz"
                          value={form.prefix}
                          onChange={handlePrefixChange}
                          className="!w-32 !text-[11px]"
                          options={NUMARATOR_PREFIXES.map((p) => ({ label: p, value: p }))}
                        />
                        <Input
                          size="small"
                          value={form.siparisNo}
                          readOnly
                          className="!w-32 !text-[11px] !font-semibold !text-red-600 !bg-gray-50"
                        />
                        <label className="!text-[10px] !font-semibold !uppercase !w-24 !text-right !shrink-0">Müşteri Order No</label>
                        <Input
                          size="small"
                          value={form.musteriOrderNo}
                          onChange={(e) => setForm((prev) => ({ ...prev, musteriOrderNo: e.target.value }))}
                          className="!w-32 !text-[11px]"
                        />
                      </div>
                      <div className="!h-[2px]" />
                      <div className="!flex !items-center !gap-2">
                        <label className="!text-[10px] !font-semibold !uppercase !w-28 !text-right !shrink-0">Tarih</label>
                        <DatePicker
                          size="small"
                          value={form.tarih ? dayjs(form.tarih) : dayjs()}
                          onChange={(d) => setForm((prev) => ({ ...prev, tarih: d ? d.format('YYYY-MM-DD') : '' }))}
                          className="!w-32 !text-[11px]"
                          format="DD.MM.YYYY"
                        />
                      </div>
                      <div className="!h-[2px]" />
                      <div className="!flex !items-center !gap-2">
                        <label className="!text-[10px] !font-semibold !uppercase !w-28 !text-right !shrink-0">Müşteri</label>
                        <SearchableCariSelect
                          value={form.cariKod}
                          onChange={handleCariChange}
                          widthClass="!w-32"
                        />
                      </div>
                      <div className="!h-[2px]" />
                      <div className="!flex !items-center !gap-2">
                        <label className="!text-[10px] !font-semibold !uppercase !w-28 !text-right !shrink-0">İsteme</label>
                        <DatePicker
                          size="small"
                          value={form.istemeTarih ? dayjs(form.istemeTarih) : dayjs()}
                          onChange={(d) => setForm((prev) => ({ ...prev, istemeTarih: d ? d.format('YYYY-MM-DD') : '' }))}
                          className="!w-32 !text-[11px]"
                          format="DD.MM.YYYY"
                        />
                        <label className="!text-[10px] !font-semibold !uppercase !w-12 !text-left !shrink-0">M.İsteme</label>
                        <DatePicker
                          size="small"
                          value={form.mIstemeTarih ? dayjs(form.mIstemeTarih) : dayjs()}
                          onChange={(d) => setForm((prev) => ({ ...prev, mIstemeTarih: d ? d.format('YYYY-MM-DD') : '' }))}
                          className="!w-32 !text-[11px]"
                          format="DD.MM.YYYY"
                        />
                        <label className="!text-[10px] !font-semibold !uppercase !w-19 !text-left !shrink-0">Toplam Tutar</label>
                        <Input
                          size="small"
                          value="22.500,36 EUR"
                          readOnly
                          className="!w-32 !text-[11px] !font-semibold !text-red-600 !bg-gray-50"
                        />
                      </div>
                    </div>

                    <div className="!mt-[2px]">
                      <div className="!border !border-gray-200 !rounded-sm !p-2">
                        <div className="!flex !items-center !justify-between !mb-2">
                          <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide">Model Bilgileri</div>
                          <Button
                            size="small"
                            onClick={() =>
                              setRows((prev) => [
                                ...prev,
                                emptyRow(Date.now().toString()),
                              ])
                            }
                            className="!text-[11px]"
                          >
                            + Satır Ekle
                          </Button>
                        </div>
                        <DataGrid
                          rowData={rows}
                          columnDefs={modelColumns}
                          domLayout="normal"
                          enableColumnChooser={false}
                          enableExcelExport={false}
                          height={150}
                          rowHeight={27}
                          onCellValueChanged={handleCellValueChanged}
                          rowSelection="single"
                          getRowId={(params) => params.data.key}
                          onSelectionChanged={handleModelSelectionChanged}
                          onRowClicked={handleModelRowClick}
                        />
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'detay',
                label: 'Detay',
                children: (
                  <div className="!w-full">
                    <div className="!border !border-gray-200 !rounded-sm !p-2">
                      <div className="!flex !items-center !gap-2">
                        <label className="!text-[10px] !font-semibold !uppercase !w-28 !text-right !shrink-0">Kesim Fazlası</label>
                        <Input
                          size="small"
                          value={form.kesimFazlasi}
                          onChange={(e) => setForm((prev) => ({ ...prev, kesimFazlasi: e.target.value }))}
                          className="!w-32 !text-[11px]"
                        />
                      </div>
                      <div className="!h-[2px]" />
                      <div className="!flex !items-center !gap-2">
                        <label className="!text-[10px] !font-semibold !uppercase !w-28 !text-right !shrink-0">Müşteri Temsilcisi</label>
                        <Input
                          size="small"
                          value={form.musteriTemsilcisi}
                          readOnly
                          className="!w-48 !text-[11px] !bg-gray-50"
                        />
                      </div>
                    </div>

                    <div className="!mt-3 !border !border-gray-200 !rounded-sm !p-2">
                      <div className="!flex !items-center !gap-2">
                        <label className="!text-[10px] !font-semibold !uppercase !w-28 !text-right !shrink-0">Açıklama Türü</label>
                        <Select
                          size="small"
                          value={aciklamaTip}
                          onChange={setAciklamaTip}
                          className="!w-40 !text-[11px]"
                          options={aciklamaTipleri}
                        />
                      </div>
                      <div className="!h-2" />
                      <Input.TextArea
                        rows={4}
                        value={aciklamaMetin}
                        onChange={(e) => setAciklamaMetin(e.target.value)}
                        className="!text-[11px]"
                      />
                    </div>
                  </div>
                ),
              },
            ]}
          />

          {/* Alt tab grubu – bağımsız, kalan alanı kaplar */}
          <Tabs
            defaultActiveKey="renkBeden"
            size="small"
            tabBarGutter={2}
            className="!px-3 !pt-2 !flex-1 !flex !flex-col !min-h-0 [&_.ant-tabs-content-holder]:!flex [&_.ant-tabs-content-holder]:!flex-col [&_.ant-tabs-content-holder]:!flex-1 [&_.ant-tabs-content-holder]:!min-h-0 [&_.ant-tabs-content]:!flex-1 [&_.ant-tabs-content]:!min-h-0 [&_.ant-tabs-tabpane]:!h-full [&_.ant-tabs-nav]:!mb-[2px] [&_.ant-tabs-nav]:!border-b [&_.ant-tabs-nav]:!border-gray-200 [&_.ant-tabs-nav]:!flex-shrink-0 [&_.ant-tabs-tab]:!text-[11px] [&_.ant-tabs-tab]:!px-2 [&_.ant-tabs-tab]:!py-1 [&_.ant-tabs-tab]:!bg-[#E0E0E0] [&_.ant-tabs-tab]:!border [&_.ant-tabs-tab]:!border-gray-200 [&_.ant-tabs-tab]:!text-[#333] [&_.ant-tabs-tab-active]:!bg-white [&_.ant-tabs-tab-active]:!border-t-2 [&_.ant-tabs-tab-active]:!border-t-[#FF9933] [&_.ant-tabs-tab-active]:!text-[#FF9933] [&_.ant-tabs-ink-bar]:!hidden"
            items={[
              {
                key: 'renkBeden',
                label: 'Renk / Beden Detayları',
                children: (
                  <div className="!h-full !min-w-0 !flex !flex-col !gap-[2px]">
                    {(modelBedenler.length > 0 || kumasGruplari.length > 0) && (
                      <div className="!border !border-gray-200 !rounded-sm !px-2 !py-1.5 !flex !items-center !gap-2 !flex-shrink-0 !flex-wrap">
                        {kumasGruplari.length > 0 && (
                          <>
                            <span className="!text-[10px] !font-semibold !uppercase !text-[#333]">Varyant Grupları:</span>
                            <span className="!text-[11px] !text-gray-500">{kumasGruplari.map((g) => g.kumasGrup?.kod ?? `#${g.kumasGrupId}`).join(' / ')}</span>
                            <span className="!text-gray-300">|</span>
                          </>
                        )}
                        {modelBedenler.length > 0 && (
                          <>
                            <span className="!text-[10px] !font-semibold !uppercase !text-[#333]">Bedenler:</span>
                            <span className="!text-[11px] !text-gray-500">{modelBedenler.map((b) => b.beden.kod).join(' / ')}</span>
                          </>
                        )}
                      </div>
                    )}
                    <div className="!flex-1 !min-h-0 !min-w-0 !border !border-gray-200 !rounded-sm !p-2 !flex !flex-col">
                      <div className="!flex !items-center !justify-between !mb-2 !flex-shrink-0">
                        <span className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide">Renk / Beden Detayları</span>
                        <Button
                          size="small"
                          onClick={() => {
                            if (!selectedModel) {
                              message.warning('Önce üst tablodaki Model Bilgileri gridinden bir model satırı seçin')
                              return
                            }
                            setRenkBedenRows((prev) => [...prev, emptyRenkBedenRow(kumasGruplari, modelBedenler)])
                          }}
                          className="!text-[11px]"
                        >
                          + Renk Ekle
                        </Button>
                      </div>
                      {selectedModel ? (
                        <DataGrid
                          rowData={renkBedenRows}
                          columnDefs={renkBedenColDefs}
                          domLayout="normal"
                          enableColumnChooser={false}
                          enableExcelExport={false}
                          height={260}
                          wrapperClassName="!min-h-[260px]"
                          onCellValueChanged={handleRenkBedenCellValueChanged}
                        />
                      ) : (
                        <div className="!h-full !flex !items-center !justify-center !text-[11px] !text-gray-400">
                          Model seçilmedi — üst tablodaki Model Bilgileri gridinden bir satır seçin
                        </div>
                      )}
                    </div>
                  </div>
                ),
              },
              {
                key: 'fiyat',
                label: 'Fiyat',
                children: (
                  <div className="!h-full !min-w-0 !flex !flex-col !gap-[2px]">
                    <div className="!flex-1 !min-h-0 !min-w-0 !border !border-gray-200 !rounded-sm !p-2 !flex !flex-col">
                      <div className="!flex !items-center !justify-between !mb-2 !flex-shrink-0">
                        <span className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide">Fiyat</span>
                      </div>
                      {selectedModel ? (
                        <DataGrid
                          rowData={renkBedenRows}
                          columnDefs={fiyatColDefs}
                          domLayout="normal"
                          enableColumnChooser={false}
                          enableExcelExport={false}
                          height={260}
                          wrapperClassName="!min-h-[260px]"
                          onCellValueChanged={handleFiyatCellValueChanged}
                        />
                      ) : (
                        <div className="!h-full !flex !items-center !justify-center !text-[11px] !text-gray-400">
                          Model seçilmedi — üst tablodaki Model Bilgileri gridinden bir satır seçin
                        </div>
                      )}
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </Spin>
      </div>
    </div>
  )
}