'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, Input, Checkbox, Row, Col, Select, App, Spin } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import { depoApi } from '@/lib/depo-api'
import type { Depo, CreateDepo } from '@/lib/depo-api'

const emptyData: CreateDepo = {
  kod: '',
  ad: '',
  durum: true,
  barkodOnEki: '',
  erisimKodu: '',
  ozelKod: '',
  isYeriKodu: '',
  negatifStokKontrol: 'Parametreyi Kullan',
  kritikStokKontrol: 'Parametreyi Kullan',
  anaDepoOnDegeri: false,
  sevkiyatDepoOnDegeri: false,
  sanalDepo: false,
  antrepoDepo: false,
  showRoomDeposu: false,
  kartelaDeposu: false,
  adres1: '',
  adres2: '',
  postaKodu: '',
  bolge: '',
  ulke: '',
  sehir: '',
  ilce: '',
  telefon: '',
  faks: '',
  eposta: '',
  gpsX: '',
  gpsY: '',
  aciklama: '',
}

interface DepoKartiProps {
  isNew?: boolean
  kod?: string
}

export default function DepoKarti({ isNew, kod }: DepoKartiProps) {
  const { message, modal } = App.useApp()
  const [form, setForm] = useState<CreateDepo>(emptyData)
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
      const data = await depoApi.getByKod(kod)
      setId(data.id)
      setForm({
        kod: data.kod,
        ad: data.ad,
        durum: data.durum,
        barkodOnEki: data.barkodOnEki ?? '',
        erisimKodu: data.erisimKodu ?? '',
        ozelKod: data.ozelKod ?? '',
        isYeriKodu: data.isYeriKodu ?? '',
        negatifStokKontrol: data.negatifStokKontrol ?? 'Parametreyi Kullan',
        kritikStokKontrol: data.kritikStokKontrol ?? 'Parametreyi Kullan',
        anaDepoOnDegeri: data.anaDepoOnDegeri,
        sevkiyatDepoOnDegeri: data.sevkiyatDepoOnDegeri,
        sanalDepo: data.sanalDepo,
        antrepoDepo: data.antrepoDepo,
        showRoomDeposu: data.showRoomDeposu,
        kartelaDeposu: data.kartelaDeposu,
        adres1: data.adres1 ?? '',
        adres2: data.adres2 ?? '',
        postaKodu: data.postaKodu ?? '',
        bolge: data.bolge ?? '',
        ulke: data.ulke ?? '',
        sehir: data.sehir ?? '',
        ilce: data.ilce ?? '',
        telefon: data.telefon ?? '',
        faks: data.faks ?? '',
        eposta: data.eposta ?? '',
        gpsX: data.gpsX ?? '',
        gpsY: data.gpsY ?? '',
        aciklama: data.aciklama ?? '',
      })
    } catch {
      message.warning('Kod bulunamadı')
    } finally {
      setLoading(false)
    }
  }, [])

  const set = <K extends keyof CreateDepo>(key: K, value: CreateDepo[K]) =>
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
        await depoApi.update(id, form)
        message.success('Depo başarıyla güncellendi')
      } else {
        const created = await depoApi.create(form)
        setId(created.id)
        message.success('Depo başarıyla oluşturuldu')
      }
    } catch {
      message.error('Kayıt sırasında hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handlePrevious = async () => {
    try {
      const list = await depoApi.list()
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
      const list = await depoApi.list()
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
      title: 'Depo Sil',
      content: 'Bu depoyu silmek istediğinize emin misiniz?',
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSaving(true)
        try {
          await depoApi.remove(id)
          message.success('Depo silindi')
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
              <Checkbox checked={form.durum} onChange={(e) => set('durum', e.target.checked)} className="!text-[11px]">
                Kullanımda
              </Checkbox>
            </div>
          </div>

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
                  <Row gutter={[16, 12]}>
                    <Col span={12}>
                      <div className="!border !border-gray-200 !rounded-sm !p-3">
                        <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">Depo Tanım Bilgileri</div>
                        <div className="!space-y-2.5">
                          <FormField label="Erişim Kodu">
                            <Input size="small" value={form.erisimKodu} onChange={(e) => set('erisimKodu', e.target.value)} className="!text-[11px]" />
                          </FormField>
                          <FormField label="Özel Kod">
                            <Input size="small" value={form.ozelKod} onChange={(e) => set('ozelKod', e.target.value)} className="!text-[11px]" />
                          </FormField>
                          <FormField label="İş Yeri Kodu">
                            <Input size="small" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />} value={form.isYeriKodu} onChange={(e) => set('isYeriKodu', e.target.value)} className="!text-[11px]" />
                          </FormField>
                          <FormField label="Barkod Ön Eki">
                            <Input size="small" value={form.barkodOnEki} onChange={(e) => set('barkodOnEki', e.target.value)} className="!text-[11px]" />
                          </FormField>
                        </div>
                      </div>
                      <div className="!border !border-gray-200 !rounded-sm !p-3 !mt-3">
                        <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">Stok Kontrolleri</div>
                        <div className="!space-y-2.5">
                          <FormField label="Eski Stok Kontrolü">
                            <Select size="small" value={form.negatifStokKontrol} onChange={(v) => set('negatifStokKontrol', v)} className="!w-full !text-[11px]" options={[
                              { value: 'Parametreyi Kullan', label: 'Parametreyi Kullan' },
                              { value: 'Evet', label: 'Evet' },
                              { value: 'Hayır', label: 'Hayır' },
                            ]} />
                          </FormField>
                          <FormField label="Kritik Stok Kontrolü">
                            <Select size="small" value={form.kritikStokKontrol} onChange={(v) => set('kritikStokKontrol', v)} className="!w-full !text-[11px]" options={[
                              { value: 'Parametreyi Kullan', label: 'Parametreyi Kullan' },
                              { value: 'Evet', label: 'Evet' },
                              { value: 'Hayır', label: 'Hayır' },
                            ]} />
                          </FormField>
                        </div>
                      </div>
                      <div className="!border !border-gray-200 !rounded-sm !p-3 !mt-3">
                        <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">Depo Türü Seçimi</div>
                        <div className="!flex !flex-wrap !gap-x-6 !gap-y-1">
                          <Checkbox checked={form.anaDepoOnDegeri} onChange={(e) => set('anaDepoOnDegeri', e.target.checked)} className="!text-[11px]">Ana Depo Ön Değeri</Checkbox>
                          <Checkbox checked={form.sevkiyatDepoOnDegeri} onChange={(e) => set('sevkiyatDepoOnDegeri', e.target.checked)} className="!text-[11px]">Sevkiyat Depo Ön Değeri</Checkbox>
                          <Checkbox checked={form.sanalDepo} onChange={(e) => set('sanalDepo', e.target.checked)} className="!text-[11px]">Sanal Depo</Checkbox>
                          <Checkbox checked={form.antrepoDepo} onChange={(e) => set('antrepoDepo', e.target.checked)} className="!text-[11px]">Antrepo Depo</Checkbox>
                          <Checkbox checked={form.showRoomDeposu} onChange={(e) => set('showRoomDeposu', e.target.checked)} className="!text-[11px]">ShowRoom Deposu</Checkbox>
                          <Checkbox checked={form.kartelaDeposu} onChange={(e) => set('kartelaDeposu', e.target.checked)} className="!text-[11px]">Kartela Deposu</Checkbox>
                        </div>
                      </div>
                    </Col>
                  </Row>
                ),
              },
              {
                key: 'adres',
                label: 'Adres',
                children: (
                  <Row gutter={[16, 12]}>
                    <Col span={12}>
                      <div className="!border !border-gray-200 !rounded-sm !p-3">
                        <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">Adres Bilgileri</div>
                        <div className="!space-y-2.5">
                          <FormField label="Adres-1">
                            <Input size="small" value={form.adres1} onChange={(e) => set('adres1', e.target.value)} className="!text-[11px]" />
                          </FormField>
                          <FormField label="Adres-2">
                            <Input size="small" value={form.adres2} onChange={(e) => set('adres2', e.target.value)} className="!text-[11px]" />
                          </FormField>
                          <FormField label="Posta Kodu">
                            <Input size="small" value={form.postaKodu} onChange={(e) => set('postaKodu', e.target.value)} className="!text-[11px]" />
                          </FormField>
                          <FormField label="Bölge">
                            <Input size="small" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />} value={form.bolge} onChange={(e) => set('bolge', e.target.value)} className="!text-[11px]" />
                          </FormField>
                          <FormField label="Ülke">
                            <Input size="small" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />} value={form.ulke} onChange={(e) => set('ulke', e.target.value)} className="!text-[11px]" />
                          </FormField>
                          <FormField label="Şehir">
                            <Input size="small" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />} value={form.sehir} onChange={(e) => set('sehir', e.target.value)} className="!text-[11px]" />
                          </FormField>
                          <FormField label="İlçe">
                            <Input size="small" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />} value={form.ilce} onChange={(e) => set('ilce', e.target.value)} className="!text-[11px]" />
                          </FormField>
                        </div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="!border !border-gray-200 !rounded-sm !p-3">
                        <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">İletişim & Koordinat</div>
                        <div className="!space-y-2.5">
                          <FormField label="Telefon">
                            <Input size="small" value={form.telefon} onChange={(e) => set('telefon', e.target.value)} className="!text-[11px]" />
                          </FormField>
                          <FormField label="Faks">
                            <Input size="small" value={form.faks} onChange={(e) => set('faks', e.target.value)} className="!text-[11px]" />
                          </FormField>
                          <FormField label="E-Posta Adresi">
                            <Input size="small" value={form.eposta} onChange={(e) => set('eposta', e.target.value)} className="!text-[11px]" />
                          </FormField>
                          <FormField label="GpsX Koordinatı">
                            <Input size="small" value={form.gpsX} onChange={(e) => set('gpsX', e.target.value)} className="!text-[11px]" />
                          </FormField>
                          <FormField label="GpsY Koordinatı">
                            <Input size="small" value={form.gpsY} onChange={(e) => set('gpsY', e.target.value)} className="!text-[11px]" />
                          </FormField>
                        </div>
                      </div>
                    </Col>
                  </Row>
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
