'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import dayjs from 'dayjs'
import { Tabs, Input, Select, DatePicker, Button, App, Spin, Popconfirm, Tooltip, Modal, Switch, Dropdown } from 'antd'
import type { MenuProps } from 'antd'
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
import { numaratorApi } from '@/lib/numarator-api'
import { parametreApi } from '@/lib/parametre-api'
import { siparisApi, type SiparisKalem, type SiparisRenk } from '@/lib/siparis-api'
import { useAuth } from '@/context/AuthContext'
import type { ColDef, CellValueChangedEvent, RowClickedEvent, CellDoubleClickedEvent } from 'ag-grid-community'

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
  miktar: string
  tutar: string
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
  aciklamalar: Record<number, string>
  barkodlar: Record<number, string>
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

interface StickerModalState {
  rowKey: string
  bedenId: number
}

const STICKER_ADET = 10

interface SiparisFormData {
  siparisNo: string
  musteriOrderNo: string
  numaratorId: number | null
  tarih: string
  cariKod: string
  cariHesapId?: number
  istemeTarih: string
  mIstemeTarih: string
  kesimFazlasi: string
  musteriTemsilcisi: string
  toplamTutar: string
  toplamDoviz: string
}

const emptyData: SiparisFormData = {
  siparisNo: '',
  musteriOrderNo: '',
  numaratorId: null,
  tarih: new Date().toISOString().slice(0, 10),
  cariKod: '',
  istemeTarih: new Date().toISOString().slice(0, 10),
  mIstemeTarih: new Date().toISOString().slice(0, 10),
  kesimFazlasi: '',
  musteriTemsilcisi: '',
  toplamTutar: '',
  toplamDoviz: '',
}

interface SiparisKartiProps {
  isNew?: boolean
  id?: number
  onTedarik?: (tip: 'kumas' | 'iplik' | 'aksesuar', id: number, siparisNo: string) => void
}

export default function SiparisKarti({ isNew, id, onTedarik }: SiparisKartiProps) {
  const { message, modal } = App.useApp()
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
  const [tamamlandi, setTamamlandi] = useState(false)
  const [selectedModelKey, setSelectedModelKey] = useState<string | null>(null)
  const [modelBedenler, setModelBedenler] = useState<ModelBeden[]>([])
  const [kumasGruplari, setKumasGruplari] = useState<ModelKumasGrup[]>([])
  const [renkBedenRows, setRenkBedenRows] = useState<RenkBedenRow[]>([])
  const [renkBedenCache, setRenkBedenCache] = useState<Record<string, RenkBedenRow[]>>({})
  const [stickerData, setStickerData] = useState<Record<string, Record<number, string[]>>>({})
  const [stickerModal, setStickerModal] = useState<StickerModalState | null>(null)
  const [numaratorOptions, setNumaratorOptions] = useState<{ value: number; label: string }[]>([])
  const [kayitliId, setKayitliId] = useState<number | null>(null)
  const lastLoadedRef = useRef<{ key: string; malzemeId: number | undefined } | null>(null)

  // props'taki id (mevcut kayıt) yoksa, bu oturumda yeni kaydedilen kaydın id'si kullanılır
  const aktifId = id && !isNew ? id : kayitliId

  const aciklamaTipleri = [
    { value: 'genel', label: 'Genel Açıklamalar' },
    { value: 'kesim', label: 'Kesim Açıklamaları' },
    { value: 'paket', label: 'Paket Açıklamaları' },
  ]

  const emptyRow = (key: string): ModelRow => ({ key, malzemeId: undefined, modelKod: '', modelAd: '', aciklama: '', ozelKod: '', dovizCinsi: '', dovizFiyat: '', dovizKuru: '', fiyat: '', miktar: '', tutar: '' })

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
  const aciklamalar: Record<number, string> = {}
  for (const b of bedenler) {
    aciklamalar[b.bedenId] = ''
  }
  const barkodlar: Record<number, string> = {}
  for (const b of bedenler) {
    barkodlar[b.bedenId] = ''
  }
  return {
    key: Date.now().toString() + Math.random().toString(36).slice(2),
    renkler,
    fiyatlar,
    aciklamalar,
    barkodlar,
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
    numaratorApi.list('siparis').then((list) => {
      const active = list.filter((n) => n.kullanimda)
      setNumaratorOptions(active.map((n) => ({ value: n.id, label: `${n.onEk}${n.ad ? ' - ' + n.ad : ''}` })))
    }).catch(() => setNumaratorOptions([]))
  }, [])

  useEffect(() => {
    if (id && !isNew) {
      loadById(id)
    } else {
      handleYeni()
    }
  }, [id, isNew])

  useEffect(() => {
    if (selectedModelKey) {
      setRenkBedenCache((prev) => ({ ...prev, [selectedModelKey]: renkBedenRows }))
    }
  }, [renkBedenRows, selectedModelKey])

  useEffect(() => {
    let toplam = 0
    for (const r of rows) {
      const t = parseFloat(r.tutar)
      if (Number.isFinite(t)) toplam += t
    }
    setForm((prev) => ({
      ...prev,
      toplamTutar: toplam > 0 ? toplam.toFixed(2) : '',
      toplamDoviz: '',
    }))
  }, [rows])

  const numOrNull = (v?: string | number | null): number | null => {
    if (v === undefined || v === null || v === '') return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }

  const loadById = async (_id: number) => {
    setLoading(true)
    try {
      const s = await siparisApi.get(_id)
      setForm({
        siparisNo: s.siparisNo,
        numaratorId: s.numaratorId ?? null,
        musteriOrderNo: s.musteriOrderNo ?? '',
        tarih: (s.tarih ?? '').slice(0, 10),
        cariKod: s.cariHesap?.kod ?? '',
        cariHesapId: s.cariHesapId ?? undefined,
        istemeTarih: s.istemeTarihi ? s.istemeTarihi.slice(0, 10) : '',
        mIstemeTarih: s.mIstemeTarihi ? s.mIstemeTarihi.slice(0, 10) : '',
        kesimFazlasi: s.kesimFazlasi ?? '',
        musteriTemsilcisi: s.musteriTemsilcisi ?? '',
        toplamTutar: s.toplamTutar?.toString() ?? '',
        toplamDoviz: s.toplamDoviz ?? '',
      })
      setTamamlandi(s.tamamlandi ?? false)

      const modelRows: ModelRow[] = (s.kalemler ?? []).map((k, i) => ({
        key: k.id ? `k-${k.id}` : `n-${i}`,
        malzemeId: k.malzemeId ?? undefined,
        modelKod: k.malzeme?.kod ?? '',
        modelAd: k.malzeme?.ad ?? '',
        aciklama: k.aciklama ?? '',
        ozelKod: k.ozelKod ?? '',
        dovizCinsi: k.dovizCinsi ?? '',
        dovizFiyat: k.dovizFiyati?.toString() ?? '',
        dovizKuru: k.dovizKuru?.toString() ?? '',
        fiyat: k.fiyat?.toString() ?? '',
        miktar: k.miktar?.toString() ?? '',
        tutar: k.tutar?.toString() ?? '',
      }))
      setRows(modelRows)

      const cache: Record<string, RenkBedenRow[]> = {}
      const stickers: Record<string, Record<number, string[]>> = {}
      ;(s.kalemler ?? []).forEach((k, i) => {
        const modelKey = modelRows[i]?.key
        if (!modelKey) return
        cache[modelKey] = (k.renkler ?? []).map((r, ri) => {
          const renkler: Record<number, RenkBedenVaryant> = {}
          for (const g of r.kumasGruplari ?? []) {
            renkler[g.kumasGrupId] = { renkId: g.renkId ?? null, renkAd: g.renk ? `${g.renk.kod} - ${g.renk.ad}` : '', renkHex: g.renk?.renk ?? '' }
          }
          const miktarlar: Record<number, string> = {}
          const fiyatlar: Record<number, string> = {}
          const aciklamalar: Record<number, string> = {}
          const barkodlar: Record<number, string> = {}
          const bedenSticker: Record<number, string[]> = {}
          for (const b of r.bedenler ?? []) {
            miktarlar[b.bedenId] = b.miktar?.toString() ?? ''
            fiyatlar[b.bedenId] = b.fiyat?.toString() ?? ''
            aciklamalar[b.bedenId] = b.aciklama ?? ''
            barkodlar[b.bedenId] = b.barkod ?? ''
            bedenSticker[b.bedenId] = Array.from({ length: STICKER_ADET }, (_, si) =>
              b.stickerler?.find((st) => st.sira === si + 1)?.deger ?? '',
            )
          }
          const renkKey = r.id ? `r-${r.id}` : `nr-${i}-${ri}`
          stickers[renkKey] = bedenSticker
          return {
            key: renkKey,
            renkler,
            fiyatlar,
            aciklamalar,
            barkodlar,
            ozelKod: r.ozelKod ?? '',
            musteriOrderNo: r.musteriOrderNo ?? '',
            partOrderNo: r.partOrderNo ?? '',
            aciklama: r.aciklama ?? '',
            istemeTarih: r.istemeTarihi ? r.istemeTarihi.slice(0, 10) : '',
            fiyat: r.fiyat?.toString() ?? '',
            kesimUretim: r.kesimUretim ?? '',
            lot: r.lot?.toString() ?? '',
            miktarlar,
            lotToplami: r.lotToplami?.toString() ?? '',
            toplam: r.toplam?.toString() ?? '',
            genelToplam: r.genelToplam?.toString() ?? '',
          }
        })
      })
      setRenkBedenCache(cache)
      setStickerData(stickers)

      const genelAciklama = s.aciklamalar?.find((a) => a.tip === 'genel')
      const ilkAciklama = s.aciklamalar?.[0]
      const acik = genelAciklama ?? ilkAciklama
      setAciklamaTip(acik?.tip ?? 'genel')
      setAciklamaMetin(acik?.metin ?? '')

      if (modelRows.length > 0) {
        handleModelSelect(modelRows[0], cache)
      } else {
        setSelectedModelKey(null)
        setRenkBedenRows([])
        setModelBedenler([])
        setKumasGruplari([])
        lastLoadedRef.current = null
      }
    } catch {
      message.warning('Sipariş bulunamadı')
    } finally {
      setLoading(false)
    }
  }

  const handleNumaratorChange = async (numaratorId: number) => {
    try {
      const { siparisNo } = await siparisApi.nextNo(numaratorId)
      setForm((prev) => ({ ...prev, numaratorId, siparisNo }))
      setIsDirty(true)
    } catch {
      message.warning('Numaratörden sıra alınamadı')
    }
  }

  const handleCariChange = (kod: string, rec?: { id: number }) => {
    setForm((prev) => ({ ...prev, cariKod: kod, cariHesapId: rec?.id }))
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
                    ? {
                        ...row,
                        malzemeId: rec?.id,
                        modelKod: kod,
                        modelAd: rec?.ad ?? '',
                        dovizCinsi,
                        dovizFiyat,
                        dovizKuru,
                        fiyat,
                        tutar: hesaplaTutar(fiyat, row.miktar),
                      }
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
      { headerName: 'Miktar', field: 'miktar', width: 100, minWidth: 80, cellClass: '!text-right !font-medium', cellRenderer: (p: { data: ModelRow }) => (
        <span className="!text-[12px] !text-[#f57c00]">{p.data.miktar || ''}</span>
      )},
      { headerName: 'Tutar', field: 'tutar', width: 110, minWidth: 90, cellClass: '!text-right !font-medium',
        valueFormatter: (p: { value: string }) => p.value || '',
      },
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

const renkBedenAciklamaColDefs = useMemo<ColDef<RenkBedenRow>[]>(() => {
  const bedenAciklamaCols: ColDef<RenkBedenRow>[] = modelBedenler.map((b) => ({
    headerName: b.beden.kod,
    field: `aciklamalar.${b.bedenId}`,
    width: 90,
    minWidth: 70,
    editable: true,
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
    ...bedenAciklamaCols,
  ]
}, [modelBedenler])

const renkBedenBarkodColDefs = useMemo<ColDef<RenkBedenRow>[]>(() => {
  const bedenBarkodCols: ColDef<RenkBedenRow>[] = modelBedenler.map((b) => ({
    headerName: b.beden.kod,
    field: `barkodlar.${b.bedenId}`,
    width: 90,
    minWidth: 70,
    editable: true,
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
    ...bedenBarkodCols,
  ]
}, [modelBedenler])

const stickerColDefs = useMemo<ColDef<RenkBedenRow>[]>(() => {
  const bedenStickerCols: ColDef<RenkBedenRow>[] = modelBedenler.map((b) => ({
    headerName: b.beden.kod,
    field: `sticker.${b.bedenId}`,
    width: 90,
    minWidth: 70,
    sortable: false,
    filter: false,
    cellClass: '!p-1 !cursor-pointer',
    cellRenderer: (p: { data: RenkBedenRow }) => {
      const values = stickerData[p.data.key]?.[b.bedenId]
      const dolu = (values ?? []).filter((v) => v && v.trim() !== '').length
      return (
        <div className="!flex !items-center !justify-center !gap-1 !h-full">
          <span className={`!inline-block !w-2 !h-2 !rounded-full ${dolu > 0 ? '!bg-[#FF9933]' : '!bg-gray-200'}`} />
          <span className="!text-[11px] !text-gray-500">{dolu > 0 ? `${dolu}/10` : ''}</span>
        </div>
      )
    },
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
    ...bedenStickerCols,
  ]
}, [modelBedenler, stickerData])

  const selectedModel = rows.find((r) => r.key === selectedModelKey) ?? null

  const handleYeni = async () => {
    let defaultKesimFazlasi = ''
    try {
      const p = await parametreApi.get('siparis', 'kesimFazlasi')
      defaultKesimFazlasi = p.deger ?? ''
    } catch {
      defaultKesimFazlasi = ''
    }
    setKayitliId(null)
    setForm({ ...emptyData, kesimFazlasi: defaultKesimFazlasi, musteriTemsilcisi: kayitYapan })
    setRows([])
    setRenkBedenRows([])
    setRenkBedenCache({})
    setStickerData({})
    setStickerModal(null)
    setSelectedModelKey(null)
    setModelBedenler([])
    setKumasGruplari([])
    setAciklamaTip('genel')
    setAciklamaMetin('')
    setIsDirty(false)
  }

  const buildKalemler = (): SiparisKalem[] =>
    rows.map((row, i) => {
      const renkRows = renkBedenCache[row.key] ?? []
      return {
        malzemeId: row.malzemeId ?? null,
        aciklama: row.aciklama || null,
        ozelKod: row.ozelKod || null,
        dovizCinsi: row.dovizCinsi || null,
        dovizFiyati: numOrNull(row.dovizFiyat),
        dovizKuru: numOrNull(row.dovizKuru),
        fiyat: numOrNull(row.fiyat),
        miktar: numOrNull(row.miktar),
        tutar: numOrNull(row.tutar),
        sira: i,
        renkler: renkRows.map((r, ri): SiparisRenk => ({
          ozelKod: r.ozelKod || null,
          musteriOrderNo: r.musteriOrderNo || null,
          partOrderNo: r.partOrderNo || null,
          aciklama: r.aciklama || null,
          istemeTarihi: r.istemeTarih || null,
          fiyat: numOrNull(r.fiyat),
          kesimUretim: r.kesimUretim || null,
          lot: numOrNull(r.lot),
          lotToplami: numOrNull(r.lotToplami),
          toplam: numOrNull(r.toplam),
          genelToplam: numOrNull(r.genelToplam),
          sira: ri,
          kumasGruplari: Object.entries(r.renkler).map(([gid, v]) => ({
            kumasGrupId: Number(gid),
            renkId: v.renkId ?? null,
          })),
          bedenler: Object.entries(r.miktarlar).map(([bedenIdStr, _m], bi) => {
            const bedenId = Number(bedenIdStr)
            return {
              bedenId,
              miktar: numOrNull(r.miktarlar[bedenId]),
              fiyat: numOrNull(r.fiyatlar[bedenId]),
              aciklama: r.aciklamalar[bedenId] || null,
              barkod: r.barkodlar[bedenId] || null,
              sira: bi,
              stickerler: (stickerData[r.key]?.[bedenId] ?? []).map((deger, si) => ({
                sira: si + 1,
                deger: deger || null,
              })),
            }
          }),
        })),
      }
    })

  const handleKaydet = async () => {
    setSaving(true)
    try {
      const payload = {
        numaratorId: form.numaratorId ?? undefined,
        siparisNo: form.siparisNo || undefined,
        musteriOrderNo: form.musteriOrderNo || null,
        tarih: form.tarih || new Date().toISOString().slice(0, 10),
        istemeTarihi: form.istemeTarih || null,
        mIstemeTarihi: form.mIstemeTarih || null,
        kesimFazlasi: form.kesimFazlasi || null,
        musteriTemsilcisi: form.musteriTemsilcisi || null,
        toplamTutar: numOrNull(form.toplamTutar),
        toplamDoviz: form.toplamDoviz || null,
        tamamlandi: tamamlandi,
        cariHesapId: form.cariHesapId ?? null,
        kalemler: buildKalemler(),
        aciklamalar: [{ tip: aciklamaTip, metin: aciklamaMetin || null }],
      }
      if (aktifId) {
        await siparisApi.update(aktifId, { ...payload, guncelleyen: kayitYapan || null })
        message.success('Sipariş güncellendi')
      } else {
        const created = await siparisApi.create({ ...payload, kayitYapan: kayitYapan || null })
        setKayitliId(created.id)
        if (created?.siparisNo && created.siparisNo !== payload.siparisNo) {
          setForm((prev) => ({ ...prev, siparisNo: created.siparisNo }))
        }
        message.success(`Sipariş kaydedildi (${created.siparisNo})`)
      }
      setIsDirty(false)
    } catch {
      message.error('Kayıt sırasında hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handlePrevious = () => message.info('İlk kayıttasınız')
  const handleNext = () => message.info('Son kayıttasınız')

  const handleSil = async () => {
    if (!aktifId) {
      message.warning('Silinecek kayıt seçili değil')
      return
    }
    modal.confirm({
      title: 'Sipariş Sil',
      content: `"${form.siparisNo || aktifId}" numaralı siparişi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await siparisApi.remove(aktifId)
          message.success('Sipariş silindi')
          handleYeni()
        } catch (err: unknown) {
          message.error('Silme sırasında hata oluştu: ' + ((err as Error)?.message ?? String(err)))
        }
      },
    })
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
        updated.tutar = hesaplaTutar(updated.fiyat, updated.miktar)
        return updated
      }),
    )
    setIsDirty(true)
  }

  const hesaplaTutar = (fiyatTl: string, miktar: string): string => {
    const f = parseFloat(fiyatTl) || 0
    const m = parseFloat(miktar) || 0
    return f > 0 && m > 0 ? (f * m).toFixed(2) : ''
  }

  useEffect(() => {
    const herModel = new Map(rows.map((r) => [r.key, r]))
    for (const [modelKey, satirlar] of Object.entries(renkBedenCache)) {
      const model = herModel.get(modelKey)
      if (!model) continue
      let toplamAdet = 0
      for (const satir of satirlar) {
        for (const [, v] of Object.entries(satir.miktarlar)) {
          const n = parseFloat(v)
          if (Number.isFinite(n)) toplamAdet += n
        }
      }
      const miktar = toplamAdet > 0 ? String(toplamAdet) : ''
      const tutar = hesaplaTutar(model.fiyat, miktar)
      if (model.miktar !== miktar || model.tutar !== tutar) {
        herModel.set(modelKey, { ...model, miktar, tutar })
      }
    }
    const degisti = rows.some((r) => {
      const yeni = herModel.get(r.key)
      return yeni && (yeni.miktar !== r.miktar || yeni.tutar !== r.tutar)
    })
    if (degisti) {
      setRows(rows.map((r) => herModel.get(r.key) ?? r))
    }
  }, [renkBedenCache])

  const handleModelSelect = (row: ModelRow | null, rowsOverride?: Record<string, RenkBedenRow[]>) => {
    if (!row) {
      setSelectedModelKey(null)
      setRenkBedenRows([])
      setStickerModal(null)
      setModelBedenler([])
      setKumasGruplari([])
      lastLoadedRef.current = null
      return
    }
    if (row.key === selectedModelKey && lastLoadedRef.current?.malzemeId === row.malzemeId) return
    setSelectedModelKey(row.key)
    setStickerModal(null)
    setModelBedenler([])
    setKumasGruplari([])
    const overrideRows = rowsOverride?.[row.key]
    const cachedRows = renkBedenCache[row.key]
    const initialRows = overrideRows?.length
      ? overrideRows
      : cachedRows?.length
        ? cachedRows
        : []
    if (!row.malzemeId) {
      setRenkBedenRows(initialRows.length ? initialRows : [emptyRenkBedenRow([], [])])
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
        setRenkBedenRows(initialRows.length ? initialRows : [emptyRenkBedenRow(gruplar, bedenler)])
        lastLoadedRef.current = { key: row.key, malzemeId: row.malzemeId }
      })
      .catch(() => {
        message.warning('Model varyant/beden bilgileri yüklenemedi')
        setRenkBedenRows(initialRows.length ? initialRows : [emptyRenkBedenRow([], [])])
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

 const updateRenkBedenRow = useCallback((key: string, patch: Partial<RenkBedenRow>) =>
 setRenkBedenRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r))),
[])

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

  const handleAciklamaCellValueChanged = (e: CellValueChangedEvent<RenkBedenRow>) => {
    const field = e.colDef.field
    if (!field || !field.startsWith('aciklamalar.')) return
    const row = e.data
    updateRenkBedenRow(row.key, { aciklamalar: { ...row.aciklamalar } })
  }

  const handleBarkodCellValueChanged = (e: CellValueChangedEvent<RenkBedenRow>) => {
    const field = e.colDef.field
    if (!field || !field.startsWith('barkodlar.')) return
    const row = e.data
    updateRenkBedenRow(row.key, { barkodlar: { ...row.barkodlar } })
  }

  const handleStickerCellDoubleClicked = (e: CellDoubleClickedEvent<RenkBedenRow>) => {
    const field = e.colDef.field
    if (!field || !field.startsWith('sticker.')) return
    const bedenId = Number(field.split('.')[1])
    setStickerModal({ rowKey: e.data.key, bedenId })
  }

  const handleStickerValueChange = (index: number, value: string) => {
    if (!stickerModal) return
    const { rowKey, bedenId } = stickerModal
    setStickerData((prev) => {
      const bedenler = { ...(prev[rowKey] ?? {}) }
      const values = [...(bedenler[bedenId] ?? Array<string>(STICKER_ADET).fill(''))]
      values[index] = value
      bedenler[bedenId] = values
      return { ...prev, [rowKey]: bedenler }
    })
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

  const tedarikMenuItems: MenuProps['items'] = [
    {
      key: 'tedarik',
      label: 'Tedarik İşlemleri',
      children: [
        { key: 'tedarik-kumas', label: 'Kumaş Tedarik' },
        { key: 'tedarik-iplik', label: 'İplik Tedarik' },
        { key: 'tedarik-aksesuar', label: 'Aksesuar Tedarik' },
      ],
    },
  ]

  const handleTedarikMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (!key.startsWith('tedarik-')) return
    if (!aktifId) {
      message.warning('Önce siparişi kaydedin')
      return
    }
    const tip = key.replace('tedarik-', '') as 'kumas' | 'iplik' | 'aksesuar'
    onTedarik?.(tip, aktifId, form.siparisNo || '')
  }

  return (
    <Dropdown menu={{ items: tedarikMenuItems, onClick: handleTedarikMenuClick }} trigger={['contextMenu']}>
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
                          value={form.numaratorId ?? undefined}
                          onChange={handleNumaratorChange}
                          className="!w-32 !text-[11px]"
                          options={numaratorOptions}
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
                          value={form.toplamTutar ? `${form.toplamTutar} TL` : ''}
                          readOnly
                          className="!w-32 !text-[11px] !font-semibold !text-red-600 !bg-gray-50"
                        />
                      </div>
                    </div>

                    <div className="!mt-[2px]">
                      <div className="!border !border-gray-200 !rounded-sm !p-2">
                        <div className="!flex !items-center !justify-between !mb-2">
                          <div className="!flex !items-center !gap-2 !min-w-0 !flex-wrap">
                            <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide">Model Bilgileri</div>
                            {(modelBedenler.length > 0 || kumasGruplari.length > 0) && (
                              <div className="!flex !items-center !gap-2 !flex-wrap">
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
                          </div>
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
                       <div className="!h-[2px]" />
                       <div className="!flex !items-center !gap-2">
                         <label className="!text-[10px] !font-semibold !uppercase !w-28 !text-right !shrink-0">Tamamlandı</label>
                         <Switch size="small" checked={tamamlandi} onChange={setTamamlandi} className="!text-[11px]" />
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
  {
    key: 'renkBedenAciklama',
    label: 'Renk / Beden Açıklamaları',
    children: (
      <div className="!h-full !min-w-0 !flex !flex-col !gap-[2px]">
        <div className="!flex-1 !min-h-0 !min-w-0 !border !border-gray-200 !rounded-sm !p-2 !flex !flex-col">
          <div className="!flex !items-center !justify-between !mb-2 !flex-shrink-0">
            <span className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide">Renk / Beden Açıklamaları</span>
          </div>
          {selectedModel ? (
            <DataGrid
              rowData={renkBedenRows}
              columnDefs={renkBedenAciklamaColDefs}
              domLayout="normal"
              enableColumnChooser={false}
              enableExcelExport={false}
              height={260}
              wrapperClassName="!min-h-[260px]"
              onCellValueChanged={handleAciklamaCellValueChanged}
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
    key: 'renkBedenBarkod',
    label: 'Renk / Beden Barkod',
    children: (
      <div className="!h-full !min-w-0 !flex !flex-col !gap-[2px]">
        <div className="!flex-1 !min-h-0 !min-w-0 !border !border-gray-200 !rounded-sm !p-2 !flex !flex-col">
          <div className="!flex !items-center !justify-between !mb-2 !flex-shrink-0">
            <span className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide">Renk / Beden Barkod</span>
          </div>
          {selectedModel ? (
            <DataGrid
              rowData={renkBedenRows}
              columnDefs={renkBedenBarkodColDefs}
              domLayout="normal"
              enableColumnChooser={false}
              enableExcelExport={false}
              height={260}
              wrapperClassName="!min-h-[260px]"
              onCellValueChanged={handleBarkodCellValueChanged}
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
    key: 'sticker',
    label: 'Sticker Detayları',
    children: (
      <div className="!h-full !min-w-0 !flex !flex-col !gap-[2px]">
        <div className="!flex-1 !min-h-0 !min-w-0 !border !border-gray-200 !rounded-sm !p-2 !flex !flex-col">
          <div className="!flex !items-center !justify-between !mb-2 !flex-shrink-0">
            <span className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide">Sticker Detayları</span>
            <span className="!text-[10px] !text-gray-400">Hücreye çift tıklayarak sticker değerlerini girin</span>
          </div>
          {selectedModel ? (
            <DataGrid
              rowData={renkBedenRows}
              columnDefs={stickerColDefs}
              domLayout="normal"
              enableColumnChooser={false}
              enableExcelExport={false}
              height={260}
              wrapperClassName="!min-h-[260px]"
              onCellDoubleClicked={handleStickerCellDoubleClicked}
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
        {stickerModal && <StickerModalComponent
          open={!!stickerModal}
          modal={stickerModal}
          renkBedenRows={renkBedenRows}
          modelBedenler={modelBedenler}
          stickerData={stickerData}
          onValueChange={handleStickerValueChange}
          onClose={() => setStickerModal(null)}
        />}
      </div>
    </div>
    </Dropdown>
  )
}

interface StickerModalComponentProps {
  open: boolean
  modal: StickerModalState
  renkBedenRows: RenkBedenRow[]
  modelBedenler: ModelBeden[]
  stickerData: Record<string, Record<number, string[]>>
  onValueChange: (index: number, value: string) => void
  onClose: () => void
}

function StickerModalComponent({
  open,
  modal,
  renkBedenRows,
  modelBedenler,
  stickerData,
  onValueChange,
  onClose,
}: StickerModalComponentProps) {
  const row = renkBedenRows.find((r) => r.key === modal.rowKey)
  const v = row?.renkler[Object.keys(row.renkler)[0] as unknown as number]
  const beden = modelBedenler.find((b) => b.bedenId === modal.bedenId)
  const values = stickerData[modal.rowKey]?.[modal.bedenId] ?? Array<string>(STICKER_ADET).fill('')
  const [lastEdited, setLastEdited] = useState(0)

  const handleTumuneUygula = () => {
    const deger = values[lastEdited] ?? ''
    for (let i = 0; i < STICKER_ADET; i++) {
      if (i !== lastEdited) onValueChange(i, deger)
    }
  }

  return (
    <Modal
      open={open}
      title={`Sticker Detayları — ${v?.renkAd || 'Renk seçilmedi'} / ${beden?.beden.kod ?? ''}`}
      onCancel={onClose}
      footer={[
        <Button key="tumu" size="small" onClick={handleTumuneUygula} className="!text-[11px]">
          Tümüne Uygula
        </Button>,
        <Button key="vazgec" size="small" onClick={onClose} className="!text-[11px]">
          Vazgeç
        </Button>,
        <Button key="tamam" size="small" type="primary" onClick={onClose} className="!text-[11px]">
          Tamam
        </Button>,
      ]}
      width={480}
    >
      <div className="!flex !flex-col !gap-2 !max-h-[60vh] !overflow-auto">
        {Array.from({ length: STICKER_ADET }, (_, i) => (
          <div key={i} className="!flex !items-center !gap-3">
            <span className="!w-24 !text-[11px] !font-semibold !text-[#333] !shrink-0">Sticker-{i + 1}</span>
            <Input
              size="small"
              value={values[i] ?? ''}
              onChange={(e) => {
                setLastEdited(i)
                onValueChange(i, e.target.value)
              }}
              className="!text-[11px]"
              placeholder={`Sticker-${i + 1} değeri`}
            />
          </div>
        ))}
      </div>
    </Modal>
  )
}