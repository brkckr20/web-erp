'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input, Switch, Select, DatePicker, App, Spin } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import SearchableCariSelect from '@/components/shared/SearchableCariSelect'
import SearchableRenkSelect from '@/components/shared/SearchableRenkSelect'
import { renkApi, type Renk } from '@/lib/renk-api'
import dayjs from 'dayjs'

export interface BoyahaneRenkFormData {
  kod: string
  ad: string
  cariKodu: string
  cariAdi: string
  parentRenkId: number | null
  tarih: string | null
  talepTarihi: string | null
  okeyTarihi: string | null
  ozelKod: string
  pantoneNo: string
  fiyat: number | null
  dovizCinsi: string
  renkTuru: string
  kullanimda: boolean
}

const today = dayjs().format('YYYY-MM-DD')

const emptyData: BoyahaneRenkFormData = {
  kod: '',
  ad: '',
  cariKodu: '',
  cariAdi: '',
  parentRenkId: null,
  tarih: today,
  talepTarihi: today,
  okeyTarihi: today,
  ozelKod: '',
  pantoneNo: '',
  fiyat: null,
  dovizCinsi: 'TRY',
  renkTuru: 'Kumaş',
  kullanimda: true,
}

interface BoyahaneRenkKartiProps {
  isNew?: boolean
  kod?: string
}

export default function BoyahaneRenkKarti({ isNew, kod }: BoyahaneRenkKartiProps) {
  const { message, modal } = App.useApp()
  const [form, setForm] = useState<BoyahaneRenkFormData>(emptyData)
  const [id, setId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (kod && !isNew) {
      loadByKod(kod)
    } else {
      setForm(emptyData)
      setId(null)
    }
  }, [kod, isNew])

  const loadByKod = useCallback(async (kod: string) => {
    setLoading(true)
    try {
      const data = await renkApi.getByKod(kod)
      setId(data.id)
      setForm({
        kod: data.kod,
        ad: data.ad,
        cariKodu: data.cariKodu ?? '',
        cariAdi: data.cariAdi ?? '',
        parentRenkId: data.parentRenkId ?? null,
        tarih: data.tarih ?? null,
        talepTarihi: data.talepTarihi ?? null,
        okeyTarihi: data.okeyTarihi ?? null,
        ozelKod: data.ozelKod ?? '',
        pantoneNo: data.pantoneNo ?? '',
        fiyat: data.fiyat ?? null,
        dovizCinsi: data.dovizCinsi ?? 'TRY',
        renkTuru: data.renkTuru ?? 'Kumaş',
        kullanimda: data.kullanimda,
      })
    } catch {
      message.warning('Kayıt bulunamadı')
    } finally {
      setLoading(false)
    }
  }, [])

  const set = <K extends keyof BoyahaneRenkFormData>(key: K, value: BoyahaneRenkFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleYeni = () => {
    setId(null)
    setForm(emptyData)
  }

  const handleKaydet = async () => {
    if (!form.kod.trim()) {
      message.warning('Renk kodu zorunludur')
      return
    }
    if (!form.ad.trim()) {
      message.warning('Renk adı zorunludur')
      return
    }
    setSaving(true)
    try {
      const { cariAdi, ...payloadData } = form
      const payload = {
        ...payloadData,
        tip: 2,
        tarih: form.tarih || null,
        talepTarihi: form.talepTarihi || null,
        okeyTarihi: form.okeyTarihi || null,
      }
      if (id) {
        await renkApi.update(id, payload)
        message.success('Renk güncellendi')
      } else {
        const created = await renkApi.create(payload)
        setId(created.id)
        message.success('Renk oluşturuldu')
      }
    } catch (e: any) {
      if (e?.message) {
        try {
          const parsed = JSON.parse(e.message)
          message.error(parsed.message || 'Kayıt sırasında hata oluştu')
        } catch {
          message.error(e.message)
        }
      } else {
        message.error('Kayıt sırasında hata oluştu')
      }
    } finally {
      setSaving(false)
    }
  }

  const handlePrevious = async () => {
    try {
      const list = await renkApi.list(2)
      const idx = list.findIndex((d) => d.kod === form.kod)
      if (idx <= 0) {
        message.info('İlk kayıttasınız')
        return
      }
      await loadByKod(list[idx - 1].kod)
    } catch {
      message.warning('Önceki kayıt yüklenemedi')
    }
  }

  const handleNext = async () => {
    try {
      const list = await renkApi.list(2)
      const idx = list.findIndex((d) => d.kod === form.kod)
      if (idx < 0 || idx >= list.length - 1) {
        message.info('Son kayıttasınız')
        return
      }
      await loadByKod(list[idx + 1].kod)
    } catch {
      message.warning('Sonraki kayıt yüklenemedi')
    }
  }

  const handleSil = () => {
    if (!id) return
    modal.confirm({
      title: 'Renk Sil',
      content: 'Bu rengi silmek istediğinize emin misiniz?',
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSaving(true)
        try {
          await renkApi.remove(id)
          message.success('Renk silindi')
          handleYeni()
        } catch {
          message.error('Silme sırasında hata oluştu')
        } finally {
          setSaving(false)
        }
      },
    })
  }

  const toolbarButtons = createToolbarButtons({
    onNew: handleYeni,
    onSave: handleKaydet,
    onPrevious: handlePrevious,
    onNext: handleNext,
    onDelete: handleSil,
  })

  const dovizOptions = [
    { value: 'TRY', label: 'TRY' },
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'GBP', label: 'GBP' },
  ]

  const renkTuruOptions = [
    { value: 'Kumaş', label: 'Kumaş' },
    { value: 'İplik', label: 'İplik' },
  ]

  return (
    <div className="!h-full !flex !flex-col">
      <div className="!bg-white !border !border-gray-200 !rounded-sm !flex-1 !flex !flex-col !overflow-hidden">
        <CardToolbar buttons={toolbarButtons} />
        <div className="!flex !flex-col !px-3 !py-2 !border-b !border-gray-200 !flex-shrink-0">
          <div className="!flex !items-center !gap-4">
            <div className="!flex !items-center !gap-1.5">
              <label className="!text-[11px] !font-semibold !text-[#333] !uppercase !w-20">Kodu</label>
              <Input
                size="small"
                suffix={
                  <SearchOutlined
                    style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }}
                  />
                }
                value={form.kod}
                onChange={(e) => set('kod', e.target.value)}
                className="!w-32 !text-[11px]"
              />
            </div>
          </div>
          <div className="!flex !items-center !gap-4 !mt-1.5">
            <div className="!flex !items-center !gap-1.5">
              <label className="!text-[11px] !font-semibold !text-[#333] !uppercase !w-20">Adı</label>
              <Input size="small" value={form.ad} onChange={(e) => set('ad', e.target.value)} className="!w-[200px] !text-[11px]" />
            </div>
            <Switch checked={form.kullanimda} onChange={(checked) => set('kullanimda', checked)} />
            <span className="!text-[11px]">Kullanımda</span>
          </div>
        </div>

        <Spin spinning={loading}>
          <div className="!overflow-y-auto !overflow-x-hidden !flex-1 !p-3">
            <div className="!w-full max-w-[600px]">
              <div className="!border !border-gray-200 !rounded-sm !p-3">
                <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">Boyahane Renk Detayı</div>
                <div className="!space-y-2.5">
                  <FormField label="Cari" required>
                    <SearchableCariSelect
                      value={form.cariKodu}
                      onChange={(kod, record) => {
                        set('cariKodu', kod)
                        set('cariAdi', record?.ad ?? '')
                      }}
                      className="!flex-1"
                      widthClass="!w-full"
                    />
                  </FormField>
                  <FormField label="Renk (Parent)">
                    <SearchableRenkSelect
                      value={form.parentRenkId}
                      onChange={(id) => set('parentRenkId', id)}
                      tip={1}
                      className="!flex-1"
                      widthClass="!w-full"
                    />
                  </FormField>
                  <FormField label="Tarih">
                    <DatePicker
                      size="small"
                      value={form.tarih ? dayjs(form.tarih) : null}
                      onChange={(date) => set('tarih', date ? date.format('YYYY-MM-DD') : null)}
                      className="!w-[400px] !text-[11px]"
                      format="DD.MM.YYYY"
                      placeholder="Tarih seçin"
                    />
                  </FormField>
                  <FormField label="Talep Tarihi">
                    <DatePicker
                      size="small"
                      value={form.talepTarihi ? dayjs(form.talepTarihi) : null}
                      onChange={(date) => set('talepTarihi', date ? date.format('YYYY-MM-DD') : null)}
                      className="!w-[400px] !text-[11px]"
                      format="DD.MM.YYYY"
                      placeholder="Talep tarihi seçin"
                    />
                  </FormField>
                  <FormField label="Okey Tarihi">
                    <DatePicker
                      size="small"
                      value={form.okeyTarihi ? dayjs(form.okeyTarihi) : null}
                      onChange={(date) => set('okeyTarihi', date ? date.format('YYYY-MM-DD') : null)}
                      className="!w-[400px] !text-[11px]"
                      format="DD.MM.YYYY"
                      placeholder="Okey tarihi seçin"
                    />
                  </FormField>
                  <FormField label="Özel Kod">
                    <Input
                      size="small"
                      value={form.ozelKod}
                      onChange={(e) => set('ozelKod', e.target.value)}
                      className="!w-[400px] !text-[11px]"
                    />
                  </FormField>
                  <FormField label="Pantone No">
                    <Input
                      size="small"
                      value={form.pantoneNo}
                      onChange={(e) => set('pantoneNo', e.target.value)}
                      className="!w-[400px] !text-[11px]"
                    />
                  </FormField>
                  <FormField label="Renk Türü">
                    <Select
                      size="small"
                      value={form.renkTuru}
                      onChange={(v) => set('renkTuru', v)}
                      className="!w-[400px] !text-[11px]"
                      options={renkTuruOptions}
                    />
                  </FormField>
                  <FormField label="Fiyat">
                    <Input
                      size="small"
                      type="number"
                      value={form.fiyat ?? ''}
                      onChange={(e) => set('fiyat', e.target.value ? Number(e.target.value) : null)}
                      className="!w-[400px] !text-[11px]"
                    />
                  </FormField>
                  <FormField label="Döviz Cinsi">
                    <Select
                      size="small"
                      value={form.dovizCinsi}
                      onChange={(v) => set('dovizCinsi', v)}
                      className="!w-[400px] !text-[11px]"
                      options={dovizOptions}
                    />
                  </FormField>
                </div>
              </div>
            </div>
          </div>
        </Spin>
      </div>
    </div>
  )
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="!flex !items-center !gap-2">
      <label className={`!text-[10px] !font-semibold !uppercase !w-28 !text-right !shrink-0 ${required ? '!text-red-500' : '!text-[#333]'}`}>
        {label}
      </label>
      {children}
    </div>
  )
}