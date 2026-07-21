'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, Input, Row, Col, App, Spin, Button } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import SearchableMalzemeSelect from '@/components/shared/SearchableMalzemeSelect'
import { isEmriApi } from '@/lib/is-emri-api'
import type { IsEmri, CreateIsEmri, IsEmriKalem } from '@/lib/is-emri-api'

const emptyData: CreateIsEmri = {
  aciklama: '',
  siparisNo: '',
  musteriSiparisNo: '',
  baslangicTarihi: null,
  bitisTarihi: null,
  durum: '',
  kalemler: [],
}

interface KalemRow {
  sira: number
  siparisNo: string
  malzemeId: number | null
  malzemeKod: string
  malzemeAd: string
  tur: string
  cinsi: string
  grm2: string
  en: string
  boy: string
  kg: number | null
  mt: number | null
  adet: number | null
}

const emptyKalem = (): KalemRow => ({ sira: 0, siparisNo: '', malzemeId: null, malzemeKod: '', malzemeAd: '', tur: '', cinsi: '', grm2: '', en: '', boy: '', kg: null, mt: null, adet: null })

interface IsEmriKartiProps {
  isNew?: boolean
  kod?: string
}

export default function IsEmriKarti({ isNew, kod }: IsEmriKartiProps) {
  const { message, modal } = App.useApp()
  const [form, setForm] = useState<CreateIsEmri>(emptyData)
  const [kalemler, setKalemler] = useState<KalemRow[]>([])
  const [id, setId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (kod) {
      loadByKod(kod)
    } else {
      setForm(emptyData)
      setKalemler([])
      setId(null)
    }
  }, [kod])

  const loadByKod = useCallback(async (kod: string) => {
    setLoading(true)
    try {
      const data = await isEmriApi.getByKod(kod)
      setId(data.id)
      setForm({
        isEmriNo: data.isEmriNo,
        aciklama: data.aciklama ?? '',
        siparisNo: data.siparisNo ?? '',
        musteriSiparisNo: data.musteriSiparisNo ?? '',
        baslangicTarihi: data.baslangicTarihi,
        bitisTarihi: data.bitisTarihi,
        durum: data.durum ?? '',
        kalemler: [],
      })
      setKalemler(
        (data.kalemler ?? []).map((k: any, i) => ({
          sira: k.sira ?? i,
          siparisNo: k.siparisNo ?? '',
          malzemeId: k.malzemeId ?? null,
          malzemeKod: k.malzemeKod ?? '',
          malzemeAd: k.malzemeAd ?? '',
          tur: k.malzeme?.malzemeTuru ?? '',
          cinsi: k.malzeme?.cinsi ?? '',
          grm2: k.malzeme?.grm2 ?? '',
          en: k.malzeme?.en != null ? String(k.malzeme.en) : '',
          boy: k.malzeme?.boy != null ? String(k.malzeme.boy) : '',
          kg: k.kg ?? null,
          mt: k.mt ?? null,
          adet: k.adet ?? null,
        })),
      )
    } catch {
      message.warning('Kod bulunamadı')
    } finally {
      setLoading(false)
    }
  }, [])

  const set = <K extends keyof CreateIsEmri>(key: K, value: CreateIsEmri[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const setKalem = (idx: number, key: keyof KalemRow, value: KalemRow[keyof KalemRow]) =>
    setKalemler((prev) => prev.map((k, i) => (i === idx ? { ...k, [key]: value } : k)))

  const addKalem = () => setKalemler((prev) => [...prev, emptyKalem()])

  const removeKalem = (idx: number) =>
    setKalemler((prev) => prev.filter((_, i) => i !== idx))

  const handleYeni = () => {
    setId(null)
    setForm(emptyData)
    setKalemler([])
  }

  const handleKaydet = async () => {
    setSaving(true)
    try {
      const payload: CreateIsEmri = {
        ...form,
        kalemler: kalemler.map((k, i) => ({
          sira: i,
          siparisNo: k.siparisNo || null,
          malzemeId: k.malzemeId ?? null,
          malzemeKod: k.malzemeKod || null,
          malzemeAd: k.malzemeAd || null,
          kg: k.kg ?? null,
          mt: k.mt ?? null,
          adet: k.adet ?? null,
        })),
      }
      if (id) {
        await isEmriApi.update(id, payload)
        message.success('İş emri başarıyla güncellendi')
      } else {
        const created = await isEmriApi.create(payload)
        setId(created.id)
        setForm((prev) => ({ ...prev, isEmriNo: created.isEmriNo }))
        message.success(`İş emri oluşturuldu: ${created.isEmriNo}`)
      }
    } catch {
      message.error('Kayıt sırasında hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handlePrevious = async () => {
    try {
      const list = await isEmriApi.list()
      const idx = list.findIndex((d) => d.isEmriNo === form.isEmriNo)
      if (idx <= 0) {
        message.info('İlk kayıttasınız')
        return
      }
      await loadByKod(list[idx - 1].isEmriNo)
    } catch {
      message.warning('Önceki kayıt yüklenemedi')
    }
  }

  const handleNext = async () => {
    try {
      const list = await isEmriApi.list()
      const idx = list.findIndex((d) => d.isEmriNo === form.isEmriNo)
      if (idx < 0 || idx >= list.length - 1) {
        message.info('Son kayıttasınız')
        return
      }
      await loadByKod(list[idx + 1].isEmriNo)
    } catch {
      message.warning('Sonraki kayıt yüklenemedi')
    }
  }

  const handleSil = () => {
    if (!id) return
    modal.confirm({
      title: 'İş Emri Sil',
      content: 'Bu iş emrini silmek istediğinize emin misiniz?',
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSaving(true)
        try {
          await isEmriApi.remove(id)
          message.success('İş emri silindi')
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
                <label className="!text-[11px] !font-semibold !text-[#333] !uppercase !w-20">İş Emri No</label>
                <Input
                  size="small"
                  readOnly
                  placeholder="Otomatik atanır"
                  value={form.isEmriNo ?? ''}
                  className="!w-40 !text-[11px] !bg-gray-50"
                />
              </div>
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[11px] !font-semibold !text-[#333] !uppercase !w-16">Durum</label>
                <Input size="small" value={form.durum ?? ''} onChange={(e) => set('durum', e.target.value)} className="!w-[150px] !text-[11px]" />
              </div>
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
                  <div className="!space-y-3">
                    <div className="!border !border-gray-200 !rounded-sm !p-3">
                      <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">İş Emri Bilgileri</div>
                      <div className="!space-y-2.5">
                        <FormField label="Sipariş No">
                          <Input size="small" value={form.siparisNo ?? ''} onChange={(e) => set('siparisNo', e.target.value)} className="!text-[11px]" />
                        </FormField>
                        <FormField label="Müşteri Sip. No">
                          <Input size="small" value={form.musteriSiparisNo ?? ''} onChange={(e) => set('musteriSiparisNo', e.target.value)} className="!text-[11px]" />
                        </FormField>
                        <FormField label="Açıklama">
                          <Input size="small" value={form.aciklama ?? ''} onChange={(e) => set('aciklama', e.target.value)} className="!text-[11px]" />
                        </FormField>
                      </div>
                    </div>

                    <div className="!border !border-gray-200 !rounded-sm !p-3 !flex !flex-col">
                      <div className="!flex !items-center !justify-between !mb-2">
                        <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide">Malzemeler (Kalemler)</div>
                        <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={addKalem} className="!text-[11px] !h-[22px]">
                          Satır Ekle
                        </Button>
                      </div>
                      <div className="!overflow-auto !max-h-[260px]">
                        <table className="!w-full !border-collapse !text-[11px]">
                          <thead>
                              <tr className="!bg-[#F0F0F0]">
                                <th className="!border !border-gray-200 !px-1 !py-1 !text-left !font-semibold">Malzeme Kodu</th>
                                <th className="!border !border-gray-200 !px-1 !py-1 !text-left !font-semibold">Malzeme Adı</th>
                                <th className="!border !border-gray-200 !px-1 !py-1 !text-left !font-semibold">Türü</th>
                                <th className="!border !border-gray-200 !px-1 !py-1 !text-left !font-semibold">Cinsi</th>
                                <th className="!border !border-gray-200 !px-1 !py-1 !text-left !font-semibold">Gr/m²</th>
                                <th className="!border !border-gray-200 !px-1 !py-1 !text-left !font-semibold">En</th>
                                <th className="!border !border-gray-200 !px-1 !py-1 !text-left !font-semibold">Boy</th>
                                <th className="!border !border-gray-200 !px-1 !py-1 !text-left !font-semibold !w-20">Sip. No</th>
                                <th className="!border !border-gray-200 !px-1 !py-1 !text-left !font-semibold !w-16">Kg</th>
                                <th className="!border !border-gray-200 !px-1 !py-1 !text-left !font-semibold !w-16">Mt</th>
                                <th className="!border !border-gray-200 !px-1 !py-1 !text-left !font-semibold !w-16">Adet</th>
                                <th className="!border !border-gray-200 !px-1 !py-1 !w-8"></th>
                              </tr>
                          </thead>
                          <tbody>
                            {kalemler.map((k, idx) => (
                              <tr key={idx}>
                                <td className="!border !border-gray-200 !px-1 !py-1">
                                    <SearchableMalzemeSelect
                                      value={k.malzemeKod}
                                      onChange={(kod, rec) => {
                                        setKalem(idx, 'malzemeKod', kod)
                                        setKalem(idx, 'malzemeId', rec?.id ?? null)
                                        setKalem(idx, 'malzemeAd', rec?.ad ?? '')
                                        setKalem(idx, 'tur', rec?.malzemeTuru ?? '')
                                        setKalem(idx, 'cinsi', rec?.cinsi ?? '')
                                        setKalem(idx, 'grm2', rec?.grm2 ?? '')
                                        setKalem(idx, 'en', rec?.en != null ? String(rec.en) : '')
                                        setKalem(idx, 'boy', rec?.boy != null ? String(rec.boy) : '')
                                      }}
                                      className="!text-[11px]"
                                      widthClass="!w-full"
                                      tip={2}
                                    />
                                </td>
                                <td className="!border !border-gray-200 !px-1 !py-1 !text-[11px] !text-gray-600 !align-middle">
                                  {k.malzemeAd || '-'}
                                </td>
                                <td className="!border !border-gray-200 !px-1 !py-1">
                                  <Input size="small" value={k.tur ?? ''} readOnly className="!text-[11px] !bg-gray-50" />
                                </td>
                                <td className="!border !border-gray-200 !px-1 !py-1">
                                  <Input size="small" value={k.cinsi ?? ''} readOnly className="!text-[11px] !bg-gray-50" />
                                </td>
                                <td className="!border !border-gray-200 !px-1 !py-1">
                                  <Input size="small" value={k.grm2 ?? ''} readOnly className="!text-[11px] !bg-gray-50" />
                                </td>
                                <td className="!border !border-gray-200 !px-1 !py-1">
                                  <Input size="small" value={k.en ?? ''} readOnly className="!text-[11px] !bg-gray-50" />
                                </td>
                                <td className="!border !border-gray-200 !px-1 !py-1">
                                  <Input size="small" value={k.boy ?? ''} readOnly className="!text-[11px] !bg-gray-50" />
                                </td>
                                <td className="!border !border-gray-200 !px-1 !py-1">
                                  <Input size="small" value={k.siparisNo} onChange={(e) => setKalem(idx, 'siparisNo', e.target.value)} className="!text-[11px]" />
                                </td>
                                <td className="!border !border-gray-200 !px-1 !py-1">
                                  <Input size="small" type="number" value={k.kg ?? ''} onChange={(e) => setKalem(idx, 'kg', e.target.value === '' ? null : Number(e.target.value))} className="!text-[11px]" />
                                </td>
                                <td className="!border !border-gray-200 !px-1 !py-1">
                                  <Input size="small" type="number" value={k.mt ?? ''} onChange={(e) => setKalem(idx, 'mt', e.target.value === '' ? null : Number(e.target.value))} className="!text-[11px]" />
                                </td>
                                <td className="!border !border-gray-200 !px-1 !py-1">
                                  <Input size="small" type="number" value={k.adet ?? ''} onChange={(e) => setKalem(idx, 'adet', e.target.value === '' ? null : Number(e.target.value))} className="!text-[11px]" />
                                </td>
                                <td className="!border !border-gray-200 !px-1 !py-1 !text-center">
                                  <Button size="small" danger type="text" icon={<DeleteOutlined />} onClick={() => removeKalem(idx)} />
                                </td>
                              </tr>
                            ))}
                            {kalemler.length === 0 && (
                              <tr>
                                <td colSpan={12} className="!border !border-gray-200 !px-2 !py-3 !text-center !text-[11px] !text-gray-400">
                                  Henüz kalem yok. "Satır Ekle" ile malzeme ekleyin.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
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
