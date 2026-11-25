'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Tabs, Input, Checkbox, Row, Col, Select, App, Spin, Button } from 'antd'
import { SearchOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import { kullaniciApi } from '@/lib/kullanici-api'
import type { CreateKullanici, KullaniciSeri, KullaniciTasarim } from '@/lib/kullanici-api'
import { rolApi } from '@/lib/rol-api'
import { masrafYeriApi, type MasrafYeri } from '@/lib/masraf-yeri-api'
import { useKirli } from '@/lib/kirli'
import { hataMetni } from '@/lib/hata'

const belgeTuruOptions = [
  { value: 'E_IRSALIYE', label: 'e-İrsaliye' },
  { value: 'E_ARSIV', label: 'e-Arşiv' },
]

const bosSeri: KullaniciSeri = { belgeTuru: 'E_IRSALIYE', seri: '', sonSira: 0, sonYil: null, aktif: true }
const bosTasarim: KullaniciTasarim = { ad: '', xsltDosyaAdi: 'Default.xslt', varsayilan: false, sira: 0, aktif: true }

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
  seriler: [],
  tasarimlar: [],
  rolIdler: [],
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
  onKirliChange?: (kirli: boolean) => void
}

export default function KullaniciKarti({ isNew, kod, onKirliChange }: KullaniciKartiProps) {
  const { message, modal } = App.useApp()
  const [form, setForm] = useState<CreateKullanici>(emptyData)
  const [id, setId] = useState<number | null>(null)
  const [rolSecenekleri, setRolSecenekleri] = useState<{ id: number; ad: string }[]>([])
  const [masrafYerleri, setMasrafYerleri] = useState<MasrafYeri[]>([])
  const masrafYeriSecenekleri = useMemo(
    () => masrafYerleri.filter((m) => m.kullanimda).map((m) => ({ value: m.kod, label: `${m.kod} - ${m.ad}` })),
    [masrafYerleri],
  )
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { kirli, temizle } = useKirli([form])
  useEffect(() => { onKirliChange?.(kirli) }, [kirli, onKirliChange])

  useEffect(() => {
    rolApi
      .list()
      .then((liste) =>
        setRolSecenekleri(
          liste.filter((r) => r.aktif).map((r) => ({ id: r.id, ad: r.ad })),
        ),
      )
      .catch(() => setRolSecenekleri([]))
    masrafYeriApi.list().then(setMasrafYerleri).catch(() => setMasrafYerleri([]))
  }, [])

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
        sifre: '',
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
        seriler: data.seriler ?? [],
        tasarimlar: data.tasarimlar ?? [],
        rolIdler: (data.roller ?? []).map((r) => r.rol.id),
      })
    } catch {
      message.warning('Kod bulunamadı')
    } finally {
      setLoading(false)
      temizle()
    }
  }, [message])

  const set = <K extends keyof CreateKullanici>(key: K, value: CreateKullanici[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const seriler = form.seriler ?? []
  const tasarimlar = form.tasarimlar ?? []

  const setSeri = (index: number, patch: Partial<KullaniciSeri>) =>
    setForm((prev) => ({
      ...prev,
      seriler: (prev.seriler ?? []).map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }))

  const setTasarim = (index: number, patch: Partial<KullaniciTasarim>) =>
    setForm((prev) => ({
      ...prev,
      tasarimlar: (prev.tasarimlar ?? []).map((t, i) => {
        if (i !== index) {
          return patch.varsayilan === true ? { ...t, varsayilan: false } : t
        }
        return { ...t, ...patch }
      }),
    }))

  const seriEkle = () =>
    setForm((prev) => ({ ...prev, seriler: [...(prev.seriler ?? []), { ...bosSeri }] }))

  const seriSil = (index: number) =>
    setForm((prev) => ({ ...prev, seriler: (prev.seriler ?? []).filter((_, i) => i !== index) }))

  const tasarimEkle = () =>
    setForm((prev) => ({
      ...prev,
      tasarimlar: [...(prev.tasarimlar ?? []), { ...bosTasarim, varsayilan: (prev.tasarimlar ?? []).length === 0 }],
    }))

  const tasarimSil = (index: number) =>
    setForm((prev) => ({ ...prev, tasarimlar: (prev.tasarimlar ?? []).filter((_, i) => i !== index) }))

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
    temizle()
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
    if (!(form.rolIdler ?? []).length) {
      message.warning('En az bir rol seçilmelidir')
      return
    }
    setSaving(true)
    try {
      // Seri satırları büyük harf ve 3 hane olarak gönderilir; boş satırlar atlanır.
      const seriPayload = seriler
        .filter((s) => String(s.seri ?? '').trim())
        .map((s) => ({
          id: s.id,
          belgeTuru: s.belgeTuru,
          seri: String(s.seri).trim().toUpperCase(),
          aktif: s.aktif !== false,
        }))
      const tasarimPayload = tasarimlar
        .filter((t) => String(t.ad ?? '').trim() || String(t.xsltDosyaAdi ?? '').trim())
        .map((t, i) => ({
          ad: String(t.ad ?? '').trim(),
          xsltDosyaAdi: String(t.xsltDosyaAdi ?? '').trim(),
          varsayilan: t.varsayilan === true,
          sira: i,
          aktif: t.aktif !== false,
        }))
      const payload = {
        ...form,
        sifre: String(form.sifre ?? '').trim() || undefined,
        seriler: seriPayload,
        tasarimlar: tasarimPayload,
      }

      if (id) {
        await kullaniciApi.update(id, payload)
        message.success('Kullanıcı başarıyla güncellendi')
      } else {
        const created = await kullaniciApi.create(payload)
        setId(created.id)
        message.success('Kullanıcı başarıyla oluşturuldu')
      }
      if (id) await loadByKod(form.kod.trim())
    } catch (e) {
      message.error(hataMetni(e))
    } finally {
      setSaving(false)
      temizle()
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
  }, {
    save: { accent: kirli },
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
                            <Input.Password size="small" placeholder="Değiştirmek için yazın" value={form.sifre} onChange={(e) => set('sifre', e.target.value)} className="!text-[11px]" />
                          </FormField>
                          <FormField label="Roller" required>
                            <Select
                              mode="multiple"
                              size="small"
                              placeholder="En az bir rol seçin"
                              value={form.rolIdler ?? []}
                              onChange={(v) => set('rolIdler', v)}
                              className="!w-full !text-[11px]"
                              options={rolSecenekleri.map((r) => ({ value: r.id, label: r.ad }))}
                            />
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
                            <Select
                              size="small"
                              showSearch
                              allowClear
                              optionFilterProp="label"
                              value={form.masrafYeri || undefined}
                              onChange={(v) => set('masrafYeri', v ?? '')}
                              options={masrafYeriSecenekleri}
                              placeholder="Seçiniz..."
                              className="!w-full !text-[11px]"
                            />
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
              {
                key: 'ebelge',
                label: 'e-Belge',
                children: (
                  <div className="!space-y-3">
                    <div className="!border !border-gray-200 !rounded-sm !p-3">
                      <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-1">e-Belge Serileri</div>
                      <div className="!text-[10px] !text-[#6b7280] !mb-2">
                        Seri 3 hanelidir (örn. I01). Numara: seri + fiş yılı + 9 haneli sıra.
                      </div>
                      <div className="!space-y-1.5">
                        {seriler.map((s, index) => (
                          <div key={index} className="!flex !items-center !gap-2">
                            <Select
                              size="small"
                              value={s.belgeTuru}
                              onChange={(v) => setSeri(index, { belgeTuru: v })}
                              options={belgeTuruOptions}
                              className="!w-32 !text-[11px]"
                            />
                            <Input
                              size="small"
                              value={s.seri}
                              maxLength={3}
                              placeholder="I01"
                              onChange={(e) => setSeri(index, { seri: e.target.value.toUpperCase() })}
                              className="!w-20 !text-[11px]"
                            />
                            <span className="!text-[11px] !text-[#6b7280] !w-40">
                              Son Sıra: {s.sonSira ? `${s.sonYil ?? '-'} / ${s.sonSira}` : '-'}
                            </span>
                            <Checkbox
                              checked={s.aktif !== false}
                              onChange={(e) => setSeri(index, { aktif: e.target.checked })}
                              className="!text-[11px]"
                            >
                              Aktif
                            </Checkbox>
                            <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => seriSil(index)} />
                          </div>
                        ))}
                        <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={seriEkle} className="!text-[11px] !h-7">
                          Seri Ekle
                        </Button>
                      </div>
                    </div>

                    <div className="!border !border-gray-200 !rounded-sm !p-3">
                      <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-1">e-İrsaliye Tasarımları</div>
                      <div className="!text-[10px] !text-[#6b7280] !mb-2">
                        XSLT dosya adı serbest metindir; dosyalar web/public/xslt altında olmalıdır. Varsayılan tasarım fişte otomatik seçilir.
                      </div>
                      <div className="!space-y-1.5">
                        {tasarimlar.map((t, index) => (
                          <div key={index} className="!flex !items-center !gap-2">
                            <Input
                              size="small"
                              value={t.ad}
                              placeholder="Tasarım adı"
                              onChange={(e) => setTasarim(index, { ad: e.target.value })}
                              className="!w-48 !text-[11px]"
                            />
                            <Input
                              size="small"
                              value={t.xsltDosyaAdi}
                              placeholder="Default.xslt"
                              onChange={(e) => setTasarim(index, { xsltDosyaAdi: e.target.value })}
                              className="!w-56 !text-[11px]"
                            />
                            <Checkbox
                              checked={t.varsayilan === true}
                              onChange={(e) => setTasarim(index, { varsayilan: e.target.checked })}
                              className="!text-[11px]"
                            >
                              Varsayılan
                            </Checkbox>
                            <Checkbox
                              checked={t.aktif !== false}
                              onChange={(e) => setTasarim(index, { aktif: e.target.checked })}
                              className="!text-[11px]"
                            >
                              Aktif
                            </Checkbox>
                            <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => tasarimSil(index)} />
                          </div>
                        ))}
                        <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={tasarimEkle} className="!text-[11px] !h-7">
                          Tasarım Ekle
                        </Button>
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
