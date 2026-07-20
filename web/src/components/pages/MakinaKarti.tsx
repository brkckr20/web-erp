'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, Input, Switch, Select, Row, Col, InputNumber, DatePicker, App, Spin } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import { makinaApi } from '@/lib/makina-api'
import type { MakinaFormData } from '@/lib/makina-api'

const emptyData: MakinaFormData = {
  kod: '',
  ad: '',
  kullanimda: true,
  makinaTuru: null,
  marka: '',
  model: '',
  seriNo: '',
  envanterNo: '',
  kategori: '',
  lokasyon: '',
  departman: '',
  sorumlu: '',
  ureticiFirma: '',
  tedarikci: '',
  alimTarihi: null,
  garantiBitis: null,
  alimBedeli: null,
  gucKw: null,
  kapasite: '',
  kapasiteBirim: null,
  voltaj: '',
  bakimPeriyodu: null,
  bakimPeriyoduBirim: null,
  sonBakimTarihi: null,
  durumu: null,
  aciklama: '',
}

interface MakinaKartiProps {
  isNew?: boolean
  kod?: string
}

export default function MakinaKarti({ kod }: MakinaKartiProps) {
  const { message, modal } = App.useApp()
  const [form, setForm] = useState<MakinaFormData>(emptyData)
  const [id, setId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadByKod = useCallback(async (kod: string) => {
    setLoading(true)
    try {
      const data = await makinaApi.getByKod(kod)
      setId(data.id)
      setForm({
        kod: data.kod,
        ad: data.ad,
        kullanimda: data.kullanimda,
        makinaTuru: data.makinaTuru ?? null,
        marka: data.marka ?? '',
        model: data.model ?? '',
        seriNo: data.seriNo ?? '',
        envanterNo: data.envanterNo ?? '',
        kategori: data.kategori ?? '',
        lokasyon: data.lokasyon ?? '',
        departman: data.departman ?? '',
        sorumlu: data.sorumlu ?? '',
        ureticiFirma: data.ureticiFirma ?? '',
        tedarikci: data.tedarikci ?? '',
        alimTarihi: data.alimTarihi ?? null,
        garantiBitis: data.garantiBitis ?? null,
        alimBedeli: data.alimBedeli ?? null,
        gucKw: data.gucKw ?? null,
        kapasite: data.kapasite ?? '',
        kapasiteBirim: data.kapasiteBirim ?? null,
        voltaj: data.voltaj ?? '',
        bakimPeriyodu: data.bakimPeriyodu ?? null,
        bakimPeriyoduBirim: data.bakimPeriyoduBirim ?? null,
        sonBakimTarihi: data.sonBakimTarihi ?? null,
        durumu: data.durumu ?? null,
        aciklama: data.aciklama ?? '',
      })
    } catch {
      message.warning('Kod bulunamadı')
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    if (kod) {
      loadByKod(kod)
    } else {
      setForm(emptyData)
      setId(null)
    }
  }, [kod, loadByKod])

  const set = <K extends keyof MakinaFormData>(key: K, value: MakinaFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleKodAra = async () => {
    if (!form.kod.trim()) return
    await loadByKod(form.kod.trim())
  }

  const handleKodKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleKodAra()
  }

  const handleYeni = () => {
    setId(null)
    setForm(emptyData)
  }

  const handleKaydet = async () => {
    if (!form.kod.trim()) {
      message.warning('Kod alanı zorunludur')
      return
    }
    if (!form.ad.trim()) {
      message.warning('Ad alanı zorunludur')
      return
    }
    setSaving(true)
    try {
      if (id) {
        await makinaApi.update(id, form)
        message.success('Makina başarıyla güncellendi')
      } else {
        const created = await makinaApi.create(form)
        setId(created.id)
        message.success('Makina başarıyla oluşturuldu')
      }
    } catch {
      message.error('Kayıt sırasında hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handlePrevious = async () => {
    try {
      const list = await makinaApi.list()
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
      const list = await makinaApi.list()
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
      title: 'Makina Sil',
      content: 'Bu makinayı silmek istediğinize emin misiniz?',
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSaving(true)
        try {
          await makinaApi.delete(id)
          message.success('Makina silindi')
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

  const makinaTuruOptions = [
    { value: 'Kesim', label: 'Kesim' },
    { value: 'Dikim', label: 'Dikim' },
    { value: 'Örgü', label: 'Örgü' },
    { value: 'Boya', label: 'Boya' },
    { value: 'Ütü / Pres', label: 'Ütü / Pres' },
    { value: 'Paketleme', label: 'Paketleme' },
    { value: 'Nakış', label: 'Nakış' },
    { value: 'Diğer', label: 'Diğer' },
  ]

  const durumOptions = [
    { value: 'Çalışıyor', label: 'Çalışıyor' },
    { value: 'Arızalı', label: 'Arızalı' },
    { value: 'Bakımda', label: 'Bakımda' },
    { value: 'Boşta', label: 'Boşta' },
    { value: 'Hurda', label: 'Hurda' },
  ]

  const kapasiteBirimOptions = [
    { value: 'Adet/Saat', label: 'Adet/Saat' },
    { value: 'Kg/Saat', label: 'Kg/Saat' },
    { value: 'Metre/Saat', label: 'Metre/Saat' },
    { value: 'Adet/Gün', label: 'Adet/Gün' },
  ]

  const bakimPeriyoduBirimOptions = [
    { value: 'Gün', label: 'Gün' },
    { value: 'Hafta', label: 'Hafta' },
    { value: 'Ay', label: 'Ay' },
    { value: 'Yıl', label: 'Yıl' },
  ]

  const toDate = (v: string | null) => (v ? dayjs(v) : null)

  return (
    <div className="!h-full !flex !flex-col">
      <div className="!bg-white !border !border-gray-200 !rounded-sm !flex-1 !flex !flex-col !overflow-hidden">
        <CardToolbar buttons={toolbarButtons} />
        <Spin spinning={loading}>
          <div className="!flex !flex-col !px-3 !py-2 !border-b !border-gray-200 !flex-shrink-0">
            <div className="!flex !items-center !gap-4">
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[11px] !font-semibold !text-[#333] !uppercase !w-12">Kodu</label>
                <Input
                  size="small"
                  suffix={
                    <SearchOutlined
                      style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }}
                      onClick={handleKodAra}
                    />
                  }
                  value={form.kod}
                  onChange={(e) => set('kod', e.target.value)}
                  onKeyDown={handleKodKeyDown}
                  className="!w-32 !text-[11px]"
                />
              </div>
            </div>
            <div className="!flex !items-center !gap-4 !mt-1.5">
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[11px] !font-semibold !text-[#333] !uppercase !w-12">Adı</label>
                <Input size="small" value={form.ad} onChange={(e) => set('ad', e.target.value)} className="!w-[150px] !text-[11px]" />
              </div>
              <Switch checked={form.kullanimda} onChange={(checked) => set('kullanimda', checked)} />
              <span className="!text-[11px]">Kullanımda</span>
            </div>
          </div>

          <Tabs
            defaultActiveKey="genel"
            size="small"
            tabBarGutter={2}
            className="!px-3 !pt-2 !flex-1 !flex !flex-col !min-h-0 !overflow-hidden [&_.ant-tabs-content-holder]:!flex [&_.ant-tabs-content-holder]:!flex-col [&_.ant-tabs-content-holder]:!flex-1 [&_.ant-tabs-content-holder]:!min-h-0 [&_.ant-tabs-content-holder]:!overflow-hidden [&_.ant-tabs-content]:!flex-1 [&_.ant-tabs-content]:!min-h-0 [&_.ant-tabs-content]:!overflow-hidden [&_.ant-tabs-tabpane]:!h-full [&_.ant-tabs-tabpane]:!overflow-hidden [&_.ant-tabs-nav]:!mb-2 [&_.ant-tabs-nav]:!border-b [&_.ant-tabs-nav]:!border-gray-200 [&_.ant-tabs-nav]:!flex-shrink-0 [&_.ant-tabs-tab]:!text-[11px] [&_.ant-tabs-tab]:!px-2 [&_.ant-tabs-tab]:!py-1 [&_.ant-tabs-tab]:!bg-[#E0E0E0] [&_.ant-tabs-tab]:!border [&_.ant-tabs-tab]:!border-gray-200 [&_.ant-tabs-tab]:!text-[#333] [&_.ant-tabs-tab-active]:!bg-white [&_.ant-tabs-tab-active]:!border-t-2 [&_.ant-tabs-tab-active]:!border-t-[#FF9933] [&_.ant-tabs-tab-active]:!text-[#FF9933] [&_.ant-tabs-ink-bar]:!hidden"
            items={[
              {
                key: 'genel',
                label: 'Genel',
                children: (
                  <div className="!overflow-y-auto !overflow-x-hidden !h-full">
                    <Row gutter={[16, 12]}>
                      <Col span={12}>
                        <div className="!border !border-gray-200 !rounded-sm !p-3">
                          <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">Tanım Bilgileri</div>
                          <div className="!space-y-2.5">
                            <FormField label="Makina Türü">
                              <Select size="small" value={form.makinaTuru} onChange={(v) => set('makinaTuru', v)} className="!w-full !text-[11px]" options={makinaTuruOptions} allowClear />
                            </FormField>
                            <FormField label="Kategori">
                              <Input size="small" value={form.kategori ?? ''} onChange={(e) => set('kategori', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Marka">
                              <Input size="small" value={form.marka ?? ''} onChange={(e) => set('marka', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Model">
                              <Input size="small" value={form.model ?? ''} onChange={(e) => set('model', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Seri No">
                              <Input size="small" value={form.seriNo ?? ''} onChange={(e) => set('seriNo', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Envanter No">
                              <Input size="small" value={form.envanterNo ?? ''} onChange={(e) => set('envanterNo', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Durumu">
                              <Select size="small" value={form.durumu} onChange={(v) => set('durumu', v)} className="!w-full !text-[11px]" options={durumOptions} allowClear />
                            </FormField>
                          </div>
                        </div>
                        <div className="!border !border-gray-200 !rounded-sm !p-3 !mt-3">
                          <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">Yerleşim</div>
                          <div className="!space-y-2.5">
                            <FormField label="Lokasyon">
                              <Input size="small" value={form.lokasyon ?? ''} onChange={(e) => set('lokasyon', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Departman">
                              <Input size="small" value={form.departman ?? ''} onChange={(e) => set('departman', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Sorumlu">
                              <Input size="small" value={form.sorumlu ?? ''} onChange={(e) => set('sorumlu', e.target.value)} className="!text-[11px]" />
                            </FormField>
                          </div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="!border !border-gray-200 !rounded-sm !p-3">
                          <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">Tedarik / Alım</div>
                          <div className="!space-y-2.5">
                            <FormField label="Üretici Firma">
                              <Input size="small" value={form.ureticiFirma ?? ''} onChange={(e) => set('ureticiFirma', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Tedarikçi">
                              <Input size="small" value={form.tedarikci ?? ''} onChange={(e) => set('tedarikci', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Alım Tarihi">
                              <DatePicker size="small" format="DD.MM.YYYY" value={toDate(form.alimTarihi)} onChange={(d) => set('alimTarihi', d ? d.toISOString() : null)} className="!w-full !text-[11px]" />
                            </FormField>
                            <FormField label="Garanti Bitiş">
                              <DatePicker size="small" format="DD.MM.YYYY" value={toDate(form.garantiBitis)} onChange={(d) => set('garantiBitis', d ? d.toISOString() : null)} className="!w-full !text-[11px]" />
                            </FormField>
                            <FormField label="Alım Bedeli">
                              <InputNumber size="small" min={0} value={form.alimBedeli} onChange={(v) => set('alimBedeli', v)} className="!w-full !text-[11px]" />
                            </FormField>
                          </div>
                        </div>
                        <div className="!border !border-gray-200 !rounded-sm !p-3 !mt-3">
                          <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">Teknik Özellikler</div>
                          <div className="!space-y-2.5">
                            <FormField label="Güç (kW)">
                              <InputNumber size="small" min={0} value={form.gucKw} onChange={(v) => set('gucKw', v)} className="!w-full !text-[11px]" />
                            </FormField>
                            <FormField label="Kapasite">
                              <div className="!flex !items-center !gap-1">
                                <Input size="small" value={form.kapasite ?? ''} onChange={(e) => set('kapasite', e.target.value)} className="!w-24 !text-[11px]" />
                                <Select size="small" value={form.kapasiteBirim} onChange={(v) => set('kapasiteBirim', v)} className="!w-28 !text-[11px]" options={kapasiteBirimOptions} allowClear />
                              </div>
                            </FormField>
                            <FormField label="Voltaj">
                              <Input size="small" value={form.voltaj ?? ''} onChange={(e) => set('voltaj', e.target.value)} className="!text-[11px]" />
                            </FormField>
                          </div>
                        </div>
                        <div className="!border !border-gray-200 !rounded-sm !p-3 !mt-3">
                          <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">Bakım</div>
                          <div className="!space-y-2.5">
                            <FormField label="Bakım Periyodu">
                              <div className="!flex !items-center !gap-1">
                                <InputNumber size="small" min={0} max={9999} value={form.bakimPeriyodu} onChange={(v) => set('bakimPeriyodu', v)} className="!w-20 !text-[11px]" />
                                <Select size="small" value={form.bakimPeriyoduBirim} onChange={(v) => set('bakimPeriyoduBirim', v)} className="!w-20 !text-[11px]" options={bakimPeriyoduBirimOptions} allowClear />
                              </div>
                            </FormField>
                            <FormField label="Son Bakım Tarihi">
                              <DatePicker size="small" format="DD.MM.YYYY" value={toDate(form.sonBakimTarihi)} onChange={(d) => set('sonBakimTarihi', d ? d.toISOString() : null)} className="!w-full !text-[11px]" />
                            </FormField>
                            <FormField label="Açıklama">
                              <Input.TextArea size="small" rows={2} value={form.aciklama ?? ''} onChange={(e) => set('aciklama', e.target.value)} className="!text-[11px]" />
                            </FormField>
                          </div>
                        </div>
                      </Col>
                    </Row>
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
