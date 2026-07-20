'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, Input, Checkbox, Row, Col, Select, App, Spin } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import { kullaniciApi } from '@/lib/kullanici-api'
import type { CreateKullanici } from '@/lib/kullanici-api'

const emptyData: CreateKullanici = {
  kod: '',
  ad: '',
  durum: true,
  girisKodu: '',
  sifre: '',
  kullaniciRolu: '',
  cariHesapKodu: '',
  yetkiliAdi: '',
  kasaKodu: '',
  departmanKodu: '',
  personelKodu: '',
  masrafYeri: '',
  dilOndegeri: '',
  ozelKod: '',
  aciklama: '',
  kullaniciTipi: '',
  satisElemani: false,
  mobilKullanici: false,
  hizmetSunucusu: false,
}

const kullaniciTipiOptions = [
  { value: 'Standart', label: 'Standart' },
  { value: 'Yönetici', label: 'Yönetici' },
  { value: 'Muhasebe', label: 'Muhasebe' },
  { value: 'Depo', label: 'Depo' },
  { value: 'Satış', label: 'Satış' },
  { value: 'Satın Alma', label: 'Satın Alma' },
]

interface KullaniciKartiProps {
  isNew?: boolean
  kod?: string
}

export default function KullaniciKarti({ isNew, kod }: KullaniciKartiProps) {
  const { message, modal } = App.useApp()
  const [form, setForm] = useState<CreateKullanici>(emptyData)
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
      const data = await kullaniciApi.getByKod(kod)
      setId(data.id)
      setForm({
        kod: data.kod,
        ad: data.ad,
        durum: data.durum,
        girisKodu: data.girisKodu ?? '',
        sifre: data.sifre ?? '',
        kullaniciRolu: data.kullaniciRolu ?? '',
        cariHesapKodu: data.cariHesapKodu ?? '',
        yetkiliAdi: data.yetkiliAdi ?? '',
        kasaKodu: data.kasaKodu ?? '',
        departmanKodu: data.departmanKodu ?? '',
        personelKodu: data.personelKodu ?? '',
        masrafYeri: data.masrafYeri ?? '',
        dilOndegeri: data.dilOndegeri ?? '',
        ozelKod: data.ozelKod ?? '',
        aciklama: data.aciklama ?? '',
        kullaniciTipi: data.kullaniciTipi ?? '',
        satisElemani: data.satisElemani,
        mobilKullanici: data.mobilKullanici,
        hizmetSunucusu: data.hizmetSunucusu,
      })
    } catch {
      message.warning('Kod bulunamadı')
    } finally {
      setLoading(false)
    }
  }, [message])

  const set = <K extends keyof CreateKullanici>(key: K, value: CreateKullanici[K]) =>
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
        await kullaniciApi.update(id, form)
        message.success('Kullanıcı başarıyla güncellendi')
      } else {
        const created = await kullaniciApi.create(form)
        setId(created.id)
        message.success('Kullanıcı başarıyla oluşturuldu')
      }
    } catch {
      message.error('Kayıt sırasında hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handlePrevious = async () => {
    try {
      const list = await kullaniciApi.list()
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
      const list = await kullaniciApi.list()
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
      title: 'Kullanıcı Sil',
      content: 'Bu kullanıcıyı silmek istediğinize emin misiniz?',
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSaving(true)
        try {
          await kullaniciApi.remove(id)
          message.success('Kullanıcı silindi')
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
                        <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">Kullanıcı Bilgileri</div>
                        <div className="!space-y-2.5">
                          <FormField label="Giriş Kodu">
                            <Input size="small" value={form.girisKodu} onChange={(e) => set('girisKodu', e.target.value)} className="!text-[11px]" />
                          </FormField>
                          <FormField label="Şifresi">
                            <Input.Password size="small" value={form.sifre} onChange={(e) => set('sifre', e.target.value)} className="!text-[11px]" />
                          </FormField>
                          <FormField label="Kullanıcı Rolü">
                            <Input size="small" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />} value={form.kullaniciRolu} onChange={(e) => set('kullaniciRolu', e.target.value)} className="!text-[11px]" />
                          </FormField>
                          <FormField label="Kullanıcı Tipi">
                            <Select size="small" value={form.kullaniciTipi || undefined} onChange={(v) => set('kullaniciTipi', v)} className="!w-full !text-[11px]" options={kullaniciTipiOptions} />
                          </FormField>
                          <FormField label="Cari Hesap Kodu">
                            <Input size="small" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />} value={form.cariHesapKodu} onChange={(e) => set('cariHesapKodu', e.target.value)} className="!text-[11px]" />
                          </FormField>
                          <FormField label="Yetkili Adı">
                            <Input size="small" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />} value={form.yetkiliAdi} onChange={(e) => set('yetkiliAdi', e.target.value)} className="!text-[11px]" />
                          </FormField>
                        </div>
                      </div>
                      <div className="!border !border-gray-200 !rounded-sm !p-3 !mt-3">
                        <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">Tanım Bilgileri</div>
                        <div className="!space-y-2.5">
                          <FormField label="Özel Kod">
                            <Input size="small" value={form.ozelKod} onChange={(e) => set('ozelKod', e.target.value)} className="!text-[11px]" />
                          </FormField>
                          <FormField label="Dil Öndeğeri">
                            <Input size="small" value={form.dilOndegeri} onChange={(e) => set('dilOndegeri', e.target.value)} className="!text-[11px]" />
                          </FormField>
                          <FormField label="Açıklama">
                            <Input size="small" value={form.aciklama} onChange={(e) => set('aciklama', e.target.value)} className="!text-[11px]" />
                          </FormField>
                        </div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="!border !border-gray-200 !rounded-sm !p-3">
                        <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">Yetki & Erişim</div>
                        <div className="!space-y-2.5">
                          <FormField label="Kasa Kodu">
                            <Input size="small" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />} value={form.kasaKodu} onChange={(e) => set('kasaKodu', e.target.value)} className="!text-[11px]" />
                          </FormField>
                          <FormField label="Departman Kodu">
                            <Input size="small" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />} value={form.departmanKodu} onChange={(e) => set('departmanKodu', e.target.value)} className="!text-[11px]" />
                          </FormField>
                          <FormField label="Personel Kodu">
                            <Input size="small" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />} value={form.personelKodu} onChange={(e) => set('personelKodu', e.target.value)} className="!text-[11px]" />
                          </FormField>
                          <FormField label="Masraf Yeri">
                            <Input size="small" suffix={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />} value={form.masrafYeri} onChange={(e) => set('masrafYeri', e.target.value)} className="!text-[11px]" />
                          </FormField>
                        </div>
                      </div>
                      <div className="!border !border-gray-200 !rounded-sm !p-3 !mt-3">
                        <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">Kullanıcı Özellikleri</div>
                        <div className="!flex !flex-wrap !gap-x-6 !gap-y-1">
                          <Checkbox checked={form.satisElemani} onChange={(e) => set('satisElemani', e.target.checked)} className="!text-[11px]">Satış Elemanı (POS)</Checkbox>
                          <Checkbox checked={form.mobilKullanici} onChange={(e) => set('mobilKullanici', e.target.checked)} className="!text-[11px]">Mobil Kullanıcı</Checkbox>
                          <Checkbox checked={form.hizmetSunucusu} onChange={(e) => set('hizmetSunucusu', e.target.checked)} className="!text-[11px]">Hizmet Sunucusu Kullanıcısı</Checkbox>
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
