'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, Input, Switch, Select, Row, Col, InputNumber, App, Spin } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import { malzemeApi } from '@/lib/malzeme-api'
import type { MalzemeFormData } from '@/lib/malzeme-api'

const emptyData: MalzemeFormData = {
  kod: '',
  ad: '',
  kullanimda: true,
  malzemeTuru: null,
  tipi: '',
  kategori: '',
  pluKodu: '',
  rafOmru: null,
  rafOmruBirim: null,
  sezon: '',
  marka: '',
  model: '',
  kdvGenel: null,
  kdvPerakende: null,
  kdvToptan: null,
  kdvPSatisIade: null,
  kdvTSatisIade: null,
  ekVergiTanimi: '',
  tevkifatSatinAlmaPay: null,
  tevkifatSatinAlmaPayda: null,
  tevkifatSatisPay: null,
  tevkifatSatisPayda: null,
  kullanimYeri: '',
  takipSekli: '',
  ureticiFirmaKodu: '',
  ureticiUrunKodu: '',
  isoDokumanNo: '',
  gtipNo: '',
  webSayfasi: '',
  kampanyaGrubu: '',
  fiyatGrubu: '',
  operasyonKodu: '',
}

interface MalzemeKartiProps {
  isNew?: boolean
  kod?: string
}

export default function MalzemeKarti({ isNew, kod }: MalzemeKartiProps) {
  const { message, modal } = App.useApp()
  const [form, setForm] = useState<MalzemeFormData>(emptyData)
  const [id, setId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (kod) {
      loadByKod(kod)
    } else {
      setForm(emptyData)
      setId(null)
    }
  }, [kod])

  const loadByKod = useCallback(async (kod: string) => {
    setLoading(true)
    try {
      const data = await malzemeApi.getByKod(kod)
      setId(data.id)
      setForm({
        kod: data.kod,
        ad: data.ad,
        kullanimda: data.kullanimda,
        malzemeTuru: data.malzemeTuru ?? null,
        tipi: data.tipi ?? '',
        kategori: data.kategori ?? '',
        pluKodu: data.pluKodu ?? '',
        rafOmru: data.rafOmru ?? null,
        rafOmruBirim: data.rafOmruBirim ?? null,
        sezon: data.sezon ?? '',
        marka: data.marka ?? '',
        model: data.model ?? '',
        kdvGenel: data.kdvGenel ?? null,
        kdvPerakende: data.kdvPerakende ?? null,
        kdvToptan: data.kdvToptan ?? null,
        kdvPSatisIade: data.kdvPSatisIade ?? null,
        kdvTSatisIade: data.kdvTSatisIade ?? null,
        ekVergiTanimi: data.ekVergiTanimi ?? '',
        tevkifatSatinAlmaPay: data.tevkifatSatinAlmaPay ?? null,
        tevkifatSatinAlmaPayda: data.tevkifatSatinAlmaPayda ?? null,
        tevkifatSatisPay: data.tevkifatSatisPay ?? null,
        tevkifatSatisPayda: data.tevkifatSatisPayda ?? null,
        kullanimYeri: data.kullanimYeri ?? '',
        takipSekli: data.takipSekli ?? '',
        ureticiFirmaKodu: data.ureticiFirmaKodu ?? '',
        ureticiUrunKodu: data.ureticiUrunKodu ?? '',
        isoDokumanNo: data.isoDokumanNo ?? '',
        gtipNo: data.gtipNo ?? '',
        webSayfasi: data.webSayfasi ?? '',
        kampanyaGrubu: data.kampanyaGrubu ?? '',
        fiyatGrubu: data.fiyatGrubu ?? '',
        operasyonKodu: data.operasyonKodu ?? '',
      })
    } catch {
      message.warning('Kod bulunamadı')
    } finally {
      setLoading(false)
    }
  }, [])

  const set = <K extends keyof MalzemeFormData>(key: K, value: MalzemeFormData[K]) =>
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
        await malzemeApi.update(id, form)
        message.success('Malzeme başarıyla güncellendi')
      } else {
        const created = await malzemeApi.create(form)
        setId(created.id)
        message.success('Malzeme başarıyla oluşturuldu')
      }
    } catch {
      message.error('Kayıt sırasında hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handlePrevious = async () => {
    try {
      const list = await malzemeApi.list()
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
      const list = await malzemeApi.list()
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
      title: 'Malzeme Sil',
      content: 'Bu malzemeyi silmek istediğinize emin misiniz?',
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSaving(true)
        try {
          await malzemeApi.delete(id)
          message.success('Malzeme silindi')
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

  const kdvOptions = [
    { value: '%0', label: '%0' },
    { value: '%1', label: '%1' },
    { value: '%8', label: '%8' },
    { value: '%10', label: '%10' },
    { value: '%18', label: '%18' },
    { value: '%20', label: '%20' },
  ]

  const malzemeTuruOptions = [
    { value: 'Hammadde', label: 'Hammadde' },
    { value: 'Yarı Mamul', label: 'Yarı Mamul' },
    { value: 'Mamul', label: 'Mamul' },
    { value: 'Ambalaj', label: 'Ambalaj' },
    { value: 'Sarf', label: 'Sarf' },
    { value: 'Yedek Parça', label: 'Yedek Parça' },
  ]

  const rafOmruBirimOptions = [
    { value: 'Gün', label: 'Gün' },
    { value: 'Ay', label: 'Ay' },
    { value: 'Yıl', label: 'Yıl' },
  ]

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
                          <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">Malzeme Bilgileri</div>
                          <div className="!space-y-2.5">
                            <FormField label="Malzeme Türü">
                              <Select size="small" value={form.malzemeTuru} onChange={(v) => set('malzemeTuru', v)} className="!w-full !text-[11px]" options={malzemeTuruOptions} allowClear />
                            </FormField>
                            <FormField label="Tipi">
                              <Input size="small" value={form.tipi} onChange={(e) => set('tipi', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Kategori">
                              <Input size="small" value={form.kategori} onChange={(e) => set('kategori', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Plu Kodu">
                              <Input size="small" value={form.pluKodu} onChange={(e) => set('pluKodu', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Kullanım Yeri">
                              <Input size="small" value={form.kullanimYeri} onChange={(e) => set('kullanimYeri', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Takip Şekli">
                              <Input size="small" value={form.takipSekli} onChange={(e) => set('takipSekli', e.target.value)} className="!text-[11px]" />
                            </FormField>
                          </div>
                        </div>
                        <div className="!border !border-gray-200 !rounded-sm !p-3 !mt-3">
                          <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">KDV Oranları</div>
                          <div className="!space-y-2.5">
                            <FormField label="Genel">
                              <Select size="small" value={form.kdvGenel} onChange={(v) => set('kdvGenel', v)} className="!w-full !text-[11px]" options={kdvOptions} allowClear />
                            </FormField>
                            <FormField label="Perakende">
                              <Select size="small" value={form.kdvPerakende} onChange={(v) => set('kdvPerakende', v)} className="!w-full !text-[11px]" options={kdvOptions} allowClear />
                            </FormField>
                            <FormField label="Toptan">
                              <Select size="small" value={form.kdvToptan} onChange={(v) => set('kdvToptan', v)} className="!w-full !text-[11px]" options={kdvOptions} allowClear />
                            </FormField>
                            <FormField label="P.Satış İade">
                              <Select size="small" value={form.kdvPSatisIade} onChange={(v) => set('kdvPSatisIade', v)} className="!w-full !text-[11px]" options={kdvOptions} allowClear />
                            </FormField>
                            <FormField label="T.Satış İade">
                              <Select size="small" value={form.kdvTSatisIade} onChange={(v) => set('kdvTSatisIade', v)} className="!w-full !text-[11px]" options={kdvOptions} allowClear />
                            </FormField>
                            <FormField label="Ek Vergi Tanımı">
                              <Input size="small" value={form.ekVergiTanimi} onChange={(e) => set('ekVergiTanimi', e.target.value)} className="!text-[11px]" />
                            </FormField>
                          </div>
                        </div>
                        <div className="!border !border-gray-200 !rounded-sm !p-3 !mt-3">
                          <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">Üretici Bilgileri</div>
                          <div className="!space-y-2.5">
                            <FormField label="Üretici Firma Kodu">
                              <Input size="small" value={form.ureticiFirmaKodu} onChange={(e) => set('ureticiFirmaKodu', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Üretici Ürün Kodu">
                              <Input size="small" value={form.ureticiUrunKodu} onChange={(e) => set('ureticiUrunKodu', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="İSO Doküman No">
                              <Input size="small" value={form.isoDokumanNo} onChange={(e) => set('isoDokumanNo', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="GTİP No">
                              <Input size="small" value={form.gtipNo} onChange={(e) => set('gtipNo', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Web Sayfası">
                              <Input size="small" type="url" value={form.webSayfasi} onChange={(e) => set('webSayfasi', e.target.value)} className="!text-[11px]" />
                            </FormField>
                          </div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="!border !border-gray-200 !rounded-sm !p-3">
                          <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">Ürün Bilgileri</div>
                          <div className="!space-y-2.5">
                            <FormField label="Raf Ömrü">
                              <div className="!flex !items-center !gap-1">
                                <InputNumber size="small" min={0} max={9999} value={form.rafOmru} onChange={(v) => set('rafOmru', v)} className="!w-20 !text-[11px]" />
                                <Select size="small" value={form.rafOmruBirim} onChange={(v) => set('rafOmruBirim', v)} className="!w-20 !text-[11px]" options={rafOmruBirimOptions} allowClear />
                              </div>
                            </FormField>
                            <FormField label="Sezon">
                              <Input size="small" value={form.sezon} onChange={(e) => set('sezon', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Marka">
                              <Input size="small" value={form.marka} onChange={(e) => set('marka', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Model">
                              <Input size="small" value={form.model} onChange={(e) => set('model', e.target.value)} className="!text-[11px]" />
                            </FormField>
                          </div>
                        </div>
                        <div className="!border !border-gray-200 !rounded-sm !p-3 !mt-3">
                          <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">Tevkifat</div>
                          <div className="!space-y-2.5">
                            <FormField label="Satın Alma Pay">
                              <InputNumber size="small" min={0} max={999} value={form.tevkifatSatinAlmaPay} onChange={(v) => set('tevkifatSatinAlmaPay', v)} className="!w-full !text-[11px]" />
                            </FormField>
                            <FormField label="Satın Alma Payda">
                              <InputNumber size="small" min={0} max={999} value={form.tevkifatSatinAlmaPayda} onChange={(v) => set('tevkifatSatinAlmaPayda', v)} className="!w-full !text-[11px]" />
                            </FormField>
                            <FormField label="Satış Pay">
                              <InputNumber size="small" min={0} max={999} value={form.tevkifatSatisPay} onChange={(v) => set('tevkifatSatisPay', v)} className="!w-full !text-[11px]" />
                            </FormField>
                            <FormField label="Satış Payda">
                              <InputNumber size="small" min={0} max={999} value={form.tevkifatSatisPayda} onChange={(v) => set('tevkifatSatisPayda', v)} className="!w-full !text-[11px]" />
                            </FormField>
                          </div>
                        </div>
                        <div className="!border !border-gray-200 !rounded-sm !p-3 !mt-3">
                          <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">Diğer Bilgiler</div>
                          <div className="!space-y-2.5">
                            <FormField label="Kampanya Grubu">
                              <Input size="small" value={form.kampanyaGrubu} onChange={(e) => set('kampanyaGrubu', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Fiyat Grubu">
                              <Input size="small" value={form.fiyatGrubu} onChange={(e) => set('fiyatGrubu', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Operasyon Kodu">
                              <Input size="small" value={form.operasyonKodu} onChange={(e) => set('operasyonKodu', e.target.value)} className="!text-[11px]" />
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
