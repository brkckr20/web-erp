'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input, Switch, App, Spin, Button } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import { nakliyeciApi, type NakliyeciFormData } from '@/lib/nakliyeci-api'
import { useKirli } from '@/lib/kirli'

const emptyData: NakliyeciFormData = {
  unvan: '',
  ad: '',
  soyad: '',
  tc: '',
  plakalar: [],
  aktif: true,
}

interface NakliyeciKartiProps {
  isNew?: boolean
  id?: number
  onKirliChange?: (kirli: boolean) => void
}

export default function NakliyeciKarti({ id, onKirliChange }: NakliyeciKartiProps) {
  const { message, modal } = App.useApp()
  const [form, setForm] = useState<NakliyeciFormData>(emptyData)
  const [dbId, setDbId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { kirli, temizle } = useKirli([form])
  useEffect(() => { onKirliChange?.(kirli) }, [kirli, onKirliChange])

  useEffect(() => {
    if (id) {
      loadById(id)
    } else {
      setForm(emptyData)
      setDbId(null)
    }
  }, [id])

  const loadById = useCallback(async (loadId: number) => {
    setLoading(true)
    try {
      const data = await nakliyeciApi.get(loadId)
      setDbId(data.id)
      setForm({
        unvan: data.unvan,
        ad: data.ad ?? '',
        soyad: data.soyad ?? '',
        tc: data.tc ?? '',
        plakalar: (data.plakalar ?? []).map((p) => p.plaka),
        aktif: data.aktif,
      })
    } catch {
      message.warning('Kayıt bulunamadı')
    } finally {
      setLoading(false)
      temizle()
    }
  }, [])

  const set = <K extends keyof NakliyeciFormData>(key: K, value: NakliyeciFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const addPlaka = () => setForm((prev) => ({ ...prev, plakalar: [...prev.plakalar, ''] }))

  const setPlaka = (index: number, value: string) =>
    setForm((prev) => ({
      ...prev,
      plakalar: prev.plakalar.map((p, i) => (i === index ? value : p)),
    }))

  const removePlaka = (index: number) =>
    setForm((prev) => ({ ...prev, plakalar: prev.plakalar.filter((_, i) => i !== index) }))

  const handleYeni = () => {
    setDbId(null)
    setForm(emptyData)
  }

  const hataMesaji = (err: any) => {
    try {
      return JSON.parse(err?.message)?.message ?? 'Kayıt sırasında hata oluştu'
    } catch {
      return 'Kayıt sırasında hata oluştu'
    }
  }

  const handleKaydet = async () => {
    if (!form.unvan.trim()) { message.warning('Ünvan alanı zorunludur'); return }
    const plakalar = form.plakalar.map((p) => p.trim()).filter(Boolean)
    const buyuk = plakalar.map((p) => p.toUpperCase())
    const tekrar = buyuk.find((p, i) => buyuk.indexOf(p) !== i)
    if (tekrar) { message.warning(`Aynı plaka birden fazla eklenemez: ${tekrar}`); return }
    setSaving(true)
    try {
      if (dbId) {
        await nakliyeciApi.update(dbId, { ...form, plakalar })
        message.success('Nakliyeci güncellendi')
      } else {
        const created = await nakliyeciApi.create({ ...form, plakalar })
        setDbId(created.id)
        message.success('Nakliyeci oluşturuldu')
      }
    } catch (err: any) {
      message.error(hataMesaji(err))
    } finally {
      setSaving(false)
      temizle()
    }
  }

  const handlePrevious = async () => {
    try {
      const list = await nakliyeciApi.list()
      const idx = list.findIndex((d) => d.id === dbId)
      if (idx <= 0) { message.info('İlk kayıttasınız'); return }
      await loadById(list[idx - 1].id)
    } catch { message.warning('Önceki kayıt yüklenemedi') }
  }

  const handleNext = async () => {
    try {
      const list = await nakliyeciApi.list()
      const idx = list.findIndex((d) => d.id === dbId)
      if (idx < 0 || idx >= list.length - 1) { message.info('Son kayıttasınız'); return }
      await loadById(list[idx + 1].id)
    } catch { message.warning('Sonraki kayıt yüklenemedi') }
  }

  const handleSil = () => {
    if (!dbId) return
    modal.confirm({
      title: 'Nakliyeci Sil',
      content: 'Bu nakliyeciyi silmek istediğinize emin misiniz?',
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSaving(true)
        try {
          await nakliyeciApi.delete(dbId)
          message.success('Nakliyeci silindi')
          handleYeni()
        } catch { message.error('Silme sırasında hata oluştu') }
        finally { setSaving(false); temizle() }
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
        <Spin spinning={loading || saving}>
          <div className="!p-3">
            <div className="!flex !gap-2">
              <div className="!flex-1 !border !border-gray-200 !rounded-sm !p-2">
                <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-1">Nakliyeci Bilgileri</div>
                <div className="!space-y-0.5">
                  <div className="!flex !items-center !gap-3">
                    <div className="!text-[12px] !text-[red] !w-24 !shrink-0">Ünvan</div>
                    <Input size="small" value={form.unvan} onChange={(e) => set('unvan', e.target.value)} className="!w-72 !text-[12px]" />
                  </div>
                  <div className="!flex !items-center !gap-3">
                    <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">Ad</div>
                    <Input size="small" value={form.ad ?? ''} onChange={(e) => set('ad', e.target.value)} className="!w-48 !text-[12px]" />
                  </div>
                  <div className="!flex !items-center !gap-3">
                    <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">Soyad</div>
                    <Input size="small" value={form.soyad ?? ''} onChange={(e) => set('soyad', e.target.value)} className="!w-48 !text-[12px]" />
                  </div>
                  <div className="!flex !items-center !gap-3">
                    <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">TC</div>
                    <Input size="small" value={form.tc ?? ''} onChange={(e) => set('tc', e.target.value)} maxLength={11} className="!w-48 !text-[12px]" />
                  </div>
                  <div className="!flex !items-center !gap-3">
                    <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">Durum</div>
                    <Switch checked={form.aktif ?? true} onChange={(v) => set('aktif', v)} size="small" />
                    <span className="!text-[12px]">{form.aktif ? 'Aktif' : 'Pasif'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="!flex !gap-2 !mt-2">
              <div className="!flex-1 !border !border-gray-200 !rounded-sm !p-2">
                <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-1">Plakalar</div>
                <div className="!space-y-0.5">
                  {form.plakalar.map((plaka, index) => (
                    <div key={index} className="!flex !items-center !gap-3">
                      <div className="!text-[12px] !text-[#6b7280] !w-24 !shrink-0">{index === 0 ? 'Plaka' : ''}</div>
                      <Input
                        size="small"
                        value={plaka}
                        onChange={(e) => setPlaka(index, e.target.value)}
                        className="!w-48 !text-[12px]"
                      />
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removePlaka(index)}
                      />
                    </div>
                  ))}
                  <div className="!flex !items-center !gap-3">
                    <div className="!w-24 !shrink-0" />
                    <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addPlaka} className="!text-[11px] !h-7">
                      Plaka Ekle
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Spin>
      </div>
    </div>
  )
}
