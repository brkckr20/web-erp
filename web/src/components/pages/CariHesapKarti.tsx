'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, Input, Switch, Select, Checkbox, Row, Col, App, Spin } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import { cariHesapApi, type CariHesapFormData } from '@/lib/cari-hesap-api'

interface CariForm {
  kod: string
  ad: string
  kullanimda: boolean
  erisimKodu: string
  ozelKod: string
  grubu: string
  sektoru: string
  ticariIslemGrubu: string
  cariHesapTipi: string
  cariHesapTuru: string
  ticariUnvani: string
  personel: string
  satisPersoneli: string
  satisKanali: string
  araciKurum: string
  potansiyel: boolean
  bayi: boolean
  faktoring: boolean
  musteriHesapKodu: string
  saticiHesapKodu: string
  vadeFarkiFaizOrani: string
  vadeOpsiyonu: string
  odemePlani: string
  indirimKodu: string
  fiyatKodu: string
  alisIndirimKodu: string
  satisIndirimKodu: string
  vergiDairesi: string
  vergiNo: string
  dovizCinsi: string
  dovizKurTipi: string
}

const emptyData: CariForm = {
  kod: '',
  ad: '',
  kullanimda: true,
  erisimKodu: '',
  ozelKod: '',
  grubu: '',
  sektoru: '',
  ticariIslemGrubu: '',
  cariHesapTipi: 'Müşteri + Tedarikçi',
  cariHesapTuru: 'Şirket',
  ticariUnvani: '',
  personel: '',
  satisPersoneli: '',
  satisKanali: '',
  araciKurum: '',
  potansiyel: false,
  bayi: false,
  faktoring: false,
  musteriHesapKodu: '',
  saticiHesapKodu: '',
  vadeFarkiFaizOrani: '',
  vadeOpsiyonu: '',
  odemePlani: '',
  indirimKodu: '',
  fiyatKodu: '',
  alisIndirimKodu: '',
  satisIndirimKodu: '',
  vergiDairesi: '',
  vergiNo: '',
  dovizCinsi: 'tl',
  dovizKurTipi: 'Parametre',
}

interface CariHesapKartiProps {
  isNew?: boolean
  kod?: string
}

export default function CariHesapKarti({ isNew, kod }: CariHesapKartiProps) {
  const { message, modal } = App.useApp()
  const [form, setForm] = useState<CariForm>(emptyData)
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
      const data = await cariHesapApi.getByKod(kod)
      setId(data.id)
      setForm({
        kod: data.kod,
        ad: data.ad,
        kullanimda: data.kullanimda,
        erisimKodu: data.erisimKodu ?? '',
        ozelKod: data.ozelKod ?? '',
        grubu: data.grubu ?? '',
        sektoru: data.sektoru ?? '',
        ticariIslemGrubu: data.ticariIslemGrubu ?? '',
        cariHesapTipi: data.cariHesapTipi ?? 'Müşteri + Tedarikçi',
        cariHesapTuru: data.cariHesapTuru ?? 'Şirket',
        ticariUnvani: data.ticariUnvani ?? '',
        personel: data.personel ?? '',
        satisPersoneli: data.satisPersoneli ?? '',
        satisKanali: data.satisKanali ?? '',
        araciKurum: data.araciKurum ?? '',
        potansiyel: data.potansiyel,
        bayi: data.bayi,
        faktoring: data.faktoring,
        musteriHesapKodu: data.musteriHesapKodu ?? '',
        saticiHesapKodu: data.saticiHesapKodu ?? '',
        vadeFarkiFaizOrani: data.vadeFarkiFaizOrani ?? '',
        vadeOpsiyonu: data.vadeOpsiyonu ?? '',
        odemePlani: data.odemePlani ?? '',
        indirimKodu: data.indirimKodu ?? '',
        fiyatKodu: data.fiyatKodu ?? '',
        alisIndirimKodu: data.alisIndirimKodu ?? '',
        satisIndirimKodu: data.satisIndirimKodu ?? '',
        vergiDairesi: data.vergiDairesi ?? '',
        vergiNo: data.vergiNo ?? '',
        dovizCinsi: data.dovizCinsi ?? 'tl',
        dovizKurTipi: data.dovizKurTipi ?? 'Parametre',
      })
    } catch {
      message.warning('Kod bulunamadı')
    } finally {
      setLoading(false)
    }
  }, [])

  const set = <K extends keyof CariForm>(key: K, value: CariForm[K]) =>
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
      const payload: CariHesapFormData = { ...form }
      if (id) {
        await cariHesapApi.update(id, payload)
        message.success('Cari hesap başarıyla güncellendi')
      } else {
        const created = await cariHesapApi.create(payload)
        setId(created.id)
        message.success('Cari hesap başarıyla oluşturuldu')
      }
    } catch {
      message.error('Kayıt sırasında hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handlePrevious = async () => {
    try {
      const list = await cariHesapApi.list()
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
      const list = await cariHesapApi.list()
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
      title: 'Cari Hesap Sil',
      content: 'Bu cari hesabı silmek istediğinize emin misiniz?',
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSaving(true)
        try {
          await cariHesapApi.remove(id)
          message.success('Cari hesap silindi')
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

  const cariTipiOptions = [
    { value: 'Müşteri + Tedarikçi', label: 'Müşteri + Tedarikçi' },
    { value: 'Müşteri', label: 'Müşteri' },
    { value: 'Tedarikçi', label: 'Tedarikçi' },
  ]
  const cariTurOptions = [
    { value: 'Şirket', label: 'Şirket' },
    { value: 'Şahıs', label: 'Şahıs' },
  ]
  const dovizOptions = [
    { value: 'tl', label: 'TL' },
    { value: 'usd', label: 'USD' },
    { value: 'eur', label: 'EUR' },
  ]
  const kurTipiOptions = [
    { value: 'Parametre', label: 'Parametre' },
    { value: 'Sabit', label: 'Sabit' },
    { value: 'Serbest', label: 'Serbest' },
  ]

  return (
    <div className="!h-full !flex !flex-col">
      <div className="!bg-white !border !border-gray-200 !rounded-sm !flex-1 !flex !flex-col !overflow-hidden">
        <CardToolbar buttons={toolbarButtons} />
        <Spin spinning={loading || saving}>
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
                <Input size="small" value={form.ad} onChange={(e) => set('ad', e.target.value)} className="!w-[300px] !text-[11px]" />
              </div>
              <Switch checked={form.kullanimda} onChange={(checked) => set('kullanimda', checked)} />
              <span className="!text-[11px]">Kullanımda</span>
            </div>
          </div>

          <Tabs
            defaultActiveKey="genel"
            size="small"
            tabBarGutter={2}
            className="!px-3 !pt-2 !flex-1 !flex !flex-col !min-h-0 !overflow-hidden [&_.ant-tabs-content-holder]:!flex [&_.ant-tabs-content-holder]:!flex-col [&_.ant-tabs-content-holder]:!flex-1 [&_.ant-tabs-content-holder]:!min-h-0 [&_.ant-tabs-content-holder]:!overflow-hidden [&_.ant-tabs-content]:!flex-1 [&_.ant-tabs-content]:!min-h-0 [&_.ant-tabs-content]:!overflow-hidden [&_.ant-tabs-tabpane]:!h-full [&_.ant-tabs-nav]:!mb-2 [&_.ant-tabs-nav]:!border-b [&_.ant-tabs-nav]:!border-gray-200 [&_.ant-tabs-nav]:!flex-shrink-0 [&_.ant-tabs-tab]:!text-[11px] [&_.ant-tabs-tab]:!px-2 [&_.ant-tabs-tab]:!py-1 [&_.ant-tabs-tab]:!bg-[#E0E0E0] [&_.ant-tabs-tab]:!border [&_.ant-tabs-tab]:!border-gray-200 [&_.ant-tabs-tab]:!text-[#333] [&_.ant-tabs-tab-active]:!bg-white [&_.ant-tabs-tab-active]:!border-t-2 [&_.ant-tabs-tab-active]:!border-t-[#FF9933] [&_.ant-tabs-tab-active]:!text-[#FF9933] [&_.ant-tabs-ink-bar]:!hidden"
            items={[
              {
                key: 'genel',
                label: 'Genel',
                children: (
                  <div className="!overflow-y-auto !overflow-x-hidden !h-full">
                    <Row gutter={[16, 12]}>
                      <Col span={12}>
                        <div className="!border !border-gray-200 !rounded-sm !p-3">
                          <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">Genel Bilgiler</div>
                          <div className="!space-y-2.5">
                            <FormField label="Erişim Kodu">
                              <Input size="small" value={form.erisimKodu} onChange={(e) => set('erisimKodu', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Özel Kod">
                              <Input size="small" value={form.ozelKod} onChange={(e) => set('ozelKod', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Grubu">
                              <Input size="small" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />} value={form.grubu} onChange={(e) => set('grubu', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Sektörü">
                              <Input size="small" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />} value={form.sektoru} onChange={(e) => set('sektoru', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Ticari İşlem Grubu">
                              <Input size="small" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />} value={form.ticariIslemGrubu} onChange={(e) => set('ticariIslemGrubu', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Cari Hesap Tipi">
                              <Select size="small" value={form.cariHesapTipi} onChange={(v) => set('cariHesapTipi', v)} className="!w-full !text-[11px]" options={cariTipiOptions} />
                            </FormField>
                            <FormField label="Cari Hesap Türü">
                              <Select size="small" value={form.cariHesapTuru} onChange={(v) => set('cariHesapTuru', v)} className="!w-full !text-[11px]" options={cariTurOptions} />
                            </FormField>
                            <FormField label="Ticari Ünvanı">
                              <Input size="small" value={form.ticariUnvani} onChange={(e) => set('ticariUnvani', e.target.value)} className="!text-[11px]" />
                            </FormField>
                          </div>
                        </div>
                        <div className="!border !border-gray-200 !rounded-sm !p-3 !mt-3">
                          <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">İlgili Kişiler</div>
                          <div className="!space-y-2.5">
                            <FormField label="Personel">
                              <Input size="small" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />} value={form.personel} onChange={(e) => set('personel', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Satış Personeli">
                              <Input size="small" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />} value={form.satisPersoneli} onChange={(e) => set('satisPersoneli', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Satış Kanalı">
                              <Input size="small" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />} value={form.satisKanali} onChange={(e) => set('satisKanali', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Aracı Kurum">
                              <Input size="small" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />} value={form.araciKurum} onChange={(e) => set('araciKurum', e.target.value)} className="!text-[11px]" />
                            </FormField>
                          </div>
                        </div>
                        <div className="!border !border-gray-200 !rounded-sm !p-3 !mt-3">
                          <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">Bayi / Faktoring</div>
                          <div className="!flex !flex-wrap !gap-x-6 !gap-y-1">
                            <Checkbox checked={form.potansiyel} onChange={(e) => set('potansiyel', e.target.checked)} className="!text-[11px]">Potansiyel</Checkbox>
                            <Checkbox checked={form.bayi} onChange={(e) => set('bayi', e.target.checked)} className="!text-[11px]">Bayi</Checkbox>
                            <Checkbox checked={form.faktoring} onChange={(e) => set('faktoring', e.target.checked)} className="!text-[11px]">Faktoring</Checkbox>
                          </div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="!border !border-gray-200 !rounded-sm !p-3">
                          <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">Ek Bilgiler</div>
                          <div className="!space-y-2.5">
                            <FormField label="Müşteri Hesap Kodu">
                              <Input size="small" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />} value={form.musteriHesapKodu} onChange={(e) => set('musteriHesapKodu', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Satıcı Hesap Kodu">
                              <Input size="small" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />} value={form.saticiHesapKodu} onChange={(e) => set('saticiHesapKodu', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Vade Farkı Faiz Oranı">
                              <Input size="small" value={form.vadeFarkiFaizOrani} onChange={(e) => set('vadeFarkiFaizOrani', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Vade Opsiyonu">
                              <Input size="small" value={form.vadeOpsiyonu} onChange={(e) => set('vadeOpsiyonu', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Ödeme Planı">
                              <Input size="small" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />} value={form.odemePlani} onChange={(e) => set('odemePlani', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="İndirim / Fiyat Kodu">
                              <div className="!flex !items-center !gap-1">
                                <Input size="small" placeholder="İndirim" value={form.indirimKodu} onChange={(e) => set('indirimKodu', e.target.value)} className="!text-[11px]" />
                                <Input size="small" placeholder="Fiyat" value={form.fiyatKodu} onChange={(e) => set('fiyatKodu', e.target.value)} className="!text-[11px]" />
                              </div>
                            </FormField>
                            <FormField label="Alış İndirim Kodu">
                              <Input size="small" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />} value={form.alisIndirimKodu} onChange={(e) => set('alisIndirimKodu', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Satış İndirim Kodu">
                              <Input size="small" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />} value={form.satisIndirimKodu} onChange={(e) => set('satisIndirimKodu', e.target.value)} className="!text-[11px]" />
                            </FormField>
                            <FormField label="Vergi Dairesi / No">
                              <div className="!flex !items-center !gap-1">
                                <Input size="small" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />} value={form.vergiDairesi} onChange={(e) => set('vergiDairesi', e.target.value)} className="!text-[11px]" />
                                <Input size="small" value={form.vergiNo} onChange={(e) => set('vergiNo', e.target.value)} className="!text-[11px]" />
                              </div>
                            </FormField>
                            <FormField label="Döviz Cinsi">
                              <Select size="small" value={form.dovizCinsi} onChange={(v) => set('dovizCinsi', v)} className="!w-full !text-[11px]" options={dovizOptions} />
                            </FormField>
                            <FormField label="Döviz Kur Tipi">
                              <Select size="small" value={form.dovizKurTipi} onChange={(v) => set('dovizKurTipi', v)} className="!w-full !text-[11px]" options={kurTipiOptions} />
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
      <label className={`!text-[10px] !font-semibold !uppercase !w-32 !text-right !shrink-0 ${required ? '!text-red-500' : '!text-[#333]'}`}>
        {label}
      </label>
      {children}
    </div>
  )
}
