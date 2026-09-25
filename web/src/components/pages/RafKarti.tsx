'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input, Checkbox, Row, Col, Select, InputNumber, App, Spin } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import { depoRafApi, type CreateDepoRaf } from '@/lib/depo-raf-api'
import { depoApi, type Depo } from '@/lib/depo-api'

interface FormState {
  depoId: number | null
  kod: string
  ad: string
  kat: number
  rafTipi: string
  kapasite: number | null
  kapasiteBirimi: string
  aktif: boolean
  sira: number
  aciklama: string
}

const emptyData: FormState = {
  depoId: null,
  kod: '',
  ad: '',
  kat: 0,
  rafTipi: '',
  kapasite: null,
  kapasiteBirimi: '',
  aktif: true,
  sira: 0,
  aciklama: '',
}

const BIRIMLER = ['kg', 'mt', 'adet', 'm2', 'koli', 'paket']

interface RafKartiProps {
  isNew?: boolean
  id?: number
}

export default function RafKarti({ id }: RafKartiProps) {
  const { message, modal } = App.useApp()
  const [form, setForm] = useState<FormState>(emptyData)
  const [kayitId, setKayitId] = useState<number | null>(null)
  const [depolar, setDepolar] = useState<Depo[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const yukle = async () => {
      try {
        setDepolar(await depoApi.list())
      } catch {
        message.warning('Depo listesi yüklenemedi')
      }
    }
    yukle()
  }, [message])

  const kayitYukle = useCallback(
    async (rafId: number) => {
      setLoading(true)
      try {
        const data = await depoRafApi.getById(rafId)
        setKayitId(data.id)
        setForm({
          depoId: data.depoId,
          kod: data.kod,
          ad: data.ad,
          kat: data.kat ?? 0,
          rafTipi: data.rafTipi ?? '',
          kapasite: data.kapasite,
          kapasiteBirimi: data.kapasiteBirimi ?? '',
          aktif: data.aktif,
          sira: data.sira,
          aciklama: data.aciklama ?? '',
        })
      } catch {
        message.warning('Raf bulunamadı')
      } finally {
        setLoading(false)
      }
    },
    [message],
  )

  useEffect(() => {
    if (id) kayitYukle(id)
    else {
      setKayitId(null)
      setForm(emptyData)
    }
  }, [id, kayitYukle])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const seciliDepo = depolar.find((d) => d.id === form.depoId)

  const handleKodAra = async () => {
    if (!form.depoId) {
      message.warning('Önce depo seçin')
      return
    }
    if (!form.kod.trim()) {
      message.warning('Aranacak raf kodunu girin')
      return
    }
    try {
      const list = await depoRafApi.list({ depoId: form.depoId })
      const eslesen = list.find((r) => r.kod.toLocaleLowerCase('tr-TR') === form.kod.trim().toLocaleLowerCase('tr-TR'))
      if (!eslesen) {
        message.info('Bu depoda bu kodla raf bulunamadı')
        return
      }
      await kayitYukle(eslesen.id)
    } catch {
      message.warning('Raf aranamadı')
    }
  }

  const handleKaydet = async () => {
    const depoId = form.depoId
    if (!depoId) {
      message.warning('Depo seçimi zorunludur')
      return
    }
    if (!form.kod.trim()) {
      message.warning('Raf kodu zorunludur')
      return
    }
    if (!form.ad.trim()) {
      message.warning('Raf adı zorunludur')
      return
    }
    setSaving(true)
    try {
      const dto: CreateDepoRaf = {
        depoId,
        kod: form.kod.trim(),
        ad: form.ad.trim(),
        kat: form.kat,
        rafTipi: form.rafTipi.trim() ? form.rafTipi.trim() : null,
        kapasite: form.kapasite,
        kapasiteBirimi: form.kapasiteBirimi.trim() ? form.kapasiteBirimi.trim() : null,
        aktif: form.aktif,
        sira: form.sira,
        aciklama: form.aciklama.trim() ? form.aciklama.trim() : null,
      }
      if (kayitId) {
        await depoRafApi.update(kayitId, dto)
        message.success('Raf güncellendi')
      } else {
        const created = await depoRafApi.create(dto)
        setKayitId(created.id)
        set('kod', created.kod)
        set('ad', created.ad)
        message.success('Raf oluşturuldu')
      }
    } catch (hata) {
      const mesaj = (hata as { message?: string })?.message
      message.error(mesaj ? String(mesaj) : 'Kayıt sırasında hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handleYeni = () => {
    setKayitId(null)
    setForm(emptyData)
  }

  const handlePrevious = async () => {
    try {
      const list = await depoRafApi.list()
      const idx = list.findIndex((r) => r.id === kayitId)
      if (idx <= 0) {
        message.info('İlk kayıttasınız')
        return
      }
      await kayitYukle(list[idx - 1].id)
    } catch {
      message.warning('Önceki kayıt yüklenemedi')
    }
  }

  const handleNext = async () => {
    try {
      const list = await depoRafApi.list()
      const idx = list.findIndex((r) => r.id === kayitId)
      if (idx < 0 || idx >= list.length - 1) {
        message.info('Son kayıttasınız')
        return
      }
      await kayitYukle(list[idx + 1].id)
    } catch {
      message.warning('Sonraki kayıt yüklenemedi')
    }
  }

  const handleSil = () => {
    if (!kayitId) return
    modal.confirm({
      title: 'Raf Sil',
      content: 'Bu rafı silmek istediğinize emin misiniz?',
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSaving(true)
        try {
          await depoRafApi.remove(kayitId)
          message.success('Raf silindi')
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
        <Spin spinning={loading || saving}>
          <div className="!flex !flex-col !px-3 !py-2 !border-b !border-gray-200 !flex-shrink-0">
            <div className="!flex !items-center !gap-4">
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[11px] !font-semibold !text-red-500 !uppercase !w-14 !text-right">Depo</label>
                <Select
                  size="small"
                  showSearch
                  optionFilterProp="label"
                  value={form.depoId}
                  onChange={(v) => set('depoId', v ?? null)}
                  placeholder="Depo seçin"
                  className="!w-64 !text-[11px]"
                  options={depolar.map((d) => ({ value: d.id, label: `${d.kod} - ${d.ad}` }))}
                />
              </div>
            </div>
            <div className="!flex !items-center !gap-4 !mt-1.5">
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[11px] !font-semibold !text-red-500 !uppercase !w-14 !text-right">Kodu</label>
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleKodAra()
                  }}
                  className="!w-32 !text-[11px]"
                />
              </div>
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[11px] !font-semibold !text-red-500 !uppercase !w-10 !text-right">Adı</label>
                <Input
                  size="small"
                  value={form.ad}
                  onChange={(e) => set('ad', e.target.value)}
                  className="!w-56 !text-[11px]"
                />
              </div>
              <Checkbox checked={form.aktif} onChange={(e) => set('aktif', e.target.checked)} className="!text-[11px]">
                Kullanımda
              </Checkbox>
              <div className="!text-[11px] !text-[#666]">{seciliDepo ? seciliDepo.ad : ''}</div>
            </div>
          </div>

          <div className="!p-3 !flex-1 !min-h-0 !overflow-auto">
            <Row gutter={[16, 12]}>
              <Col span={15}>
                <div className="!border !border-gray-200 !rounded-sm !p-3">
                  <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">
                    Raf Tanım Bilgileri
                  </div>
                  <div className="!space-y-2.5">
                    <FormField label="Kat">
                      <InputNumber
                        size="small"
                        value={form.kat}
                        onChange={(v) => set('kat', Number(v ?? 0))}
                        className="!w-28 !text-[11px]"
                      />
                    </FormField>
                    <FormField label="Raf Tipi">
                      <Select
                        size="small"
                        allowClear
                        showSearch
                        value={form.rafTipi || undefined}
                        onChange={(v) => set('rafTipi', v ?? '')}
                        placeholder="Serbest yazılabilir"
                        className="!w-full !text-[11px]"
                        options={['KUMAŞ', 'AKSESUAR', 'İPLİK', 'GENEL', 'MÜŞTERİ MALI', 'FASON'].map((t) => ({
                          value: t,
                          label: t,
                        }))}
                      />
                    </FormField>
                    <FormField label="Kapasite">
                      <div className="!flex !items-center !gap-1.5">
                        <InputNumber
                          size="small"
                          value={form.kapasite}
                          onChange={(v) => set('kapasite', v === null ? null : Number(v))}
                          placeholder="Boş bırakılabilir"
                          className="!w-40 !text-[11px]"
                        />
                        <Select
                          size="small"
                          allowClear
                          value={form.kapasiteBirimi || undefined}
                          onChange={(v) => set('kapasiteBirimi', v ?? '')}
                          placeholder="Birim"
                          className="!w-28 !text-[11px]"
                          options={BIRIMLER.map((b) => ({ value: b, label: b }))}
                        />
                      </div>
                    </FormField>
                    <FormField label="Sıra">
                      <InputNumber
                        size="small"
                        value={form.sira}
                        onChange={(v) => set('sira', Number(v ?? 0))}
                        className="!w-28 !text-[11px]"
                      />
                    </FormField>
                    <FormField label="Açıklama">
                      <Input
                        size="small"
                        value={form.aciklama}
                        onChange={(e) => set('aciklama', e.target.value)}
                        className="!text-[11px]"
                      />
                    </FormField>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </Spin>
      </div>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="!flex !items-center !gap-2">
      <label className="!text-[10px] !font-semibold !uppercase !w-24 !text-right !shrink-0 !text-[#333]">{label}</label>
      {children}
    </div>
  )
}
