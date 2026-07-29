'use client'

import { useState, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import { Tabs, Input, Select, DatePicker, Button, App, Spin } from 'antd'
import SearchableCariSelect from '@/components/shared/SearchableCariSelect'
import DataGrid from '@/components/shared/DataGrid'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'

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
}

const emptyData: SiparisFormData = {
  siparisNo: '',
  musteriOrderNo: '',
  prefix: null,
  tarih: new Date().toISOString().slice(0, 10),
  cariKod: '',
  istemeTarih: new Date().toISOString().slice(0, 10),
  mIstemeTarih: new Date().toISOString().slice(0, 10),
}

interface SiparisKartiProps {
  isNew?: boolean
  id?: number
}

export default function SiparisKarti({ isNew, id }: SiparisKartiProps) {
  const { message } = App.useApp()
  const [form, setForm] = useState<SiparisFormData>(emptyData)
  const [rows, setRows] = useState<ModelRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (id && !isNew) {
      loadById(id)
    } else {
      setForm(emptyData)
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

  const modelColumns = useMemo(
    () => [
      { headerName: 'Model Kodu', field: 'modelKod', width: 120, editable: true, minWidth: 100 },
      { headerName: 'Model Adı', field: 'modelAd', flex: 1, minWidth: 120, editable: true },
      { headerName: 'Açıklama', field: 'aciklama', flex: 1, minWidth: 100, editable: true },
      { headerName: 'Özel Kod', field: 'ozelKod', width: 100, editable: true, minWidth: 80 },
      { headerName: 'Döviz Cinsi', field: 'dovizCinsi', width: 100, editable: true, minWidth: 80 },
      { headerName: 'Döviz Fiyat', field: 'dovizFiyat', width: 100, editable: true, minWidth: 80, cellDataType: 'numeric' },
      { headerName: 'Fiyat', field: 'fiyat', width: 100, editable: true, minWidth: 80, cellDataType: 'numeric' },
    ],
    [],
  )

  const handleYeni = () => {
    setForm(emptyData)
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
        <Spin spinning={loading}>
          <Tabs
            defaultActiveKey="genel"
            size="small"
            tabBarGutter={2}
            className="!px-3 !pt-2 !flex-1 !flex !flex-col !min-h-0 [&_.ant-tabs-content-holder]:!flex [&_.ant-tabs-content-holder]:!flex-col [&_.ant-tabs-content-holder]:!flex-1 [&_.ant-tabs-content-holder]:!min-h-0 [&_.ant-tabs-content]:!flex-1 [&_.ant-tabs-content]:!min-h-0 [&_.ant-tabs-tabpane]:!h-full [&_.ant-tabs-nav]:!mb-2 [&_.ant-tabs-nav]:!border-b [&_.ant-tabs-nav]:!border-gray-200 [&_.ant-tabs-nav]:!flex-shrink-0 [&_.ant-tabs-tab]:!text-[11px] [&_.ant-tabs-tab]:!px-2 [&_.ant-tabs-tab]:!py-1 [&_.ant-tabs-tab]:!bg-[#E0E0E0] [&_.ant-tabs-tab]:!border [&_.ant-tabs-tab]:!border-gray-200 [&_.ant-tabs-tab]:!text-[#333] [&_.ant-tabs-tab-active]:!bg-white [&_.ant-tabs-tab-active]:!border-t-2 [&_.ant-tabs-tab-active]:!border-t-[#FF9933] [&_.ant-tabs-tab-active]:!text-[#FF9933] [&_.ant-tabs-ink-bar]:!hidden"
            items={[
              {
                key: 'genel',
                label: 'Genel',
                children: (
                  <div className="!overflow-y-auto !overflow-x-hidden !h-full">
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
                        </div>
                        <div className="!h-[2px]" />
                        <div className="!flex !items-center !gap-2">
                          <label className="!text-[10px] !font-semibold !uppercase !w-28 !text-right !shrink-0">M.İsteme</label>
                          <DatePicker
                            size="small"
                            value={form.mIstemeTarih ? dayjs(form.mIstemeTarih) : dayjs()}
                            onChange={(d) => setForm((prev) => ({ ...prev, mIstemeTarih: d ? d.format('YYYY-MM-DD') : '' }))}
                            className="!w-32 !text-[11px]"
                            format="DD.MM.YYYY"
                          />
                        </div>
                        <div className="!h-2" />
                        <div className="!flex !items-center !gap-2">
                          <label className="!text-[10px] !font-semibold !uppercase !w-28 !text-right !shrink-0">Toplam Tutar</label>
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
                                  {
                                    key: Date.now().toString(),
                                    modelKod: '',
                                    modelAd: '',
                                    aciklama: '',
                                    ozelKod: '',
                                    dovizCinsi: '',
                                    dovizFiyat: '',
                                    fiyat: '',
                                  },
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
                            exportFileName="model-listesi"
                            height={300}
                          />
                        </div>
                      </div>
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