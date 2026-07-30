'use client'

import { useState, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import { Tabs, Input, Select, DatePicker, Button, App, Spin, Popconfirm, Tooltip } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import SearchableCariSelect from '@/components/shared/SearchableCariSelect'
import DataGrid from '@/components/shared/DataGrid'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import SearchableMalzemeSelect from '@/components/shared/SearchableMalzemeSelect'
import { malzemeFiyatApi } from '@/lib/malzeme-fiyat-api'
import { dovizApi } from '@/lib/doviz-api'
import { useAuth } from '@/context/AuthContext'
import type { ColDef, CellValueChangedEvent } from 'ag-grid-community'

const NUMARATOR_PREFIXES = ['IH', 'TR', 'KS', 'NS', 'MS'] as const
type NumaratorPrefix = typeof NUMARATOR_PREFIXES[number]

interface ModelRow {
  key: string
  modelKod: string
  modelAd: string
  aciklama: string
  ozelKod: string
  dovizCinsi: string
  dovizFiyat: string
  dovizKuru: string
  fiyat: string
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

  const aciklamaTipleri = [
    { value: 'genel', label: 'Genel Açıklamalar' },
    { value: 'kesim', label: 'Kesim Açıklamaları' },
    { value: 'paket', label: 'Paket Açıklamaları' },
  ]

  const emptyRow = (key: string): ModelRow => ({ key, modelKod: '', modelAd: '', aciklama: '', ozelKod: '', dovizCinsi: '', dovizFiyat: '', dovizKuru: '', fiyat: '' })

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
                    ? { ...row, modelKod: kod, modelAd: rec?.ad ?? '', dovizCinsi, dovizFiyat, dovizKuru, fiyat }
                    : row,
                ),
              )
              setIsDirty(true)
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
        <Spin spinning={loading} wrapperClassName="!flex-1 !flex !flex-col !min-h-0">
          {/* Üst tab grubu – Genel / Detay, içeriği kadar yer kaplar */}
          <Tabs
            defaultActiveKey="genel"
            size="small"
            tabBarGutter={2}
            className="!flex-shrink-0 !px-3 !pt-2 [&_.ant-tabs-nav]:!mb-2 [&_.ant-tabs-nav]:!border-b [&_.ant-tabs-nav]:!border-gray-200 [&_.ant-tabs-tab]:!text-[11px] [&_.ant-tabs-tab]:!px-2 [&_.ant-tabs-tab]:!py-1 [&_.ant-tabs-tab]:!bg-[#E0E0E0] [&_.ant-tabs-tab]:!border [&_.ant-tabs-tab]:!border-gray-200 [&_.ant-tabs-tab]:!text-[#333] [&_.ant-tabs-tab-active]:!bg-white [&_.ant-tabs-tab-active]:!border-t-2 [&_.ant-tabs-tab-active]:!border-t-[#FF9933] [&_.ant-tabs-tab-active]:!text-[#FF9933] [&_.ant-tabs-ink-bar]:!hidden"
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

                    <div className="!mt-3">
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
                          onCellValueChanged={handleCellValueChanged}
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
            className="!px-3 !pt-2 !flex-1 !flex !flex-col !min-h-0 [&_.ant-tabs-content-holder]:!flex [&_.ant-tabs-content-holder]:!flex-col [&_.ant-tabs-content-holder]:!flex-1 [&_.ant-tabs-content-holder]:!min-h-0 [&_.ant-tabs-content]:!flex-1 [&_.ant-tabs-content]:!min-h-0 [&_.ant-tabs-tabpane]:!h-full [&_.ant-tabs-nav]:!mb-2 [&_.ant-tabs-nav]:!border-b [&_.ant-tabs-nav]:!border-gray-200 [&_.ant-tabs-nav]:!flex-shrink-0 [&_.ant-tabs-tab]:!text-[11px] [&_.ant-tabs-tab]:!px-2 [&_.ant-tabs-tab]:!py-1 [&_.ant-tabs-tab]:!bg-[#E0E0E0] [&_.ant-tabs-tab]:!border [&_.ant-tabs-tab]:!border-gray-200 [&_.ant-tabs-tab]:!text-[#333] [&_.ant-tabs-tab-active]:!bg-white [&_.ant-tabs-tab-active]:!border-t-2 [&_.ant-tabs-tab-active]:!border-t-[#FF9933] [&_.ant-tabs-tab-active]:!text-[#FF9933] [&_.ant-tabs-ink-bar]:!hidden"
            items={[
              {
                key: 'renkBeden',
                label: 'Renk / Beden Detayları',
                children: <div className="!h-full !flex !items-center !justify-center !text-[11px] !text-gray-400">Renk ve beden detayları burada gösterilecek</div>,
              },
            ]}
          />
        </Spin>
      </div>
    </div>
  )
}