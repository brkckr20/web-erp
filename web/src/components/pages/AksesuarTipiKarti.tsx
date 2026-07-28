'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input, Switch, App, Spin } from 'antd'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import { aksesuarTipiApi } from '@/lib/aksesuar-tipi-api'

interface FormData {
  ad: string
  onEk: string
  kullanimda: boolean
}

const emptyData: FormData = {
  ad: '',
  onEk: '',
  kullanimda: true,
}

interface AksesuarTipiKartiProps {
  isNew?: boolean
  id?: number
}

export default function AksesuarTipiKarti({ isNew, id }: AksesuarTipiKartiProps) {
  const { message, modal } = App.useApp()
  const [form, setForm] = useState<FormData>(emptyData)
  const [dbId, setDbId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

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
      const data = await aksesuarTipiApi.get(loadId)
      setDbId(data.id)
      setForm({
        ad: data.ad,
        onEk: data.onEk ?? '',
        kullanimda: data.kullanimda,
      })
    } catch {
      message.warning('Kayıt bulunamadı')
    } finally {
      setLoading(false)
    }
  }, [])

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleYeni = () => {
    setDbId(null)
    setForm(emptyData)
  }

  const handleKaydet = async () => {
    if (!form.ad.trim()) { message.warning('Ad alanı zorunludur'); return }
    setSaving(true)
    try {
      if (dbId) {
        await aksesuarTipiApi.update(dbId, form)
        message.success('Aksesuar tipi güncellendi')
      } else {
        const created = await aksesuarTipiApi.create(form)
        setDbId(created.id)
        message.success('Aksesuar tipi oluşturuldu')
      }
    } catch {
      message.error('Kayıt sırasında hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handlePrevious = async () => {
    try {
      const list = await aksesuarTipiApi.list()
      const idx = list.findIndex((d) => d.id === dbId)
      if (idx <= 0) { message.info('İlk kayıttasınız'); return }
      await loadById(list[idx - 1].id)
    } catch { message.warning('Önceki kayıt yüklenemedi') }
  }

  const handleNext = async () => {
    try {
      const list = await aksesuarTipiApi.list()
      const idx = list.findIndex((d) => d.id === dbId)
      if (idx < 0 || idx >= list.length - 1) { message.info('Son kayıttasınız'); return }
      await loadById(list[idx + 1].id)
    } catch { message.warning('Sonraki kayıt yüklenemedi') }
  }

  const handleSil = () => {
    if (!dbId) return
    modal.confirm({
      title: 'Aksesuar Tipi Sil',
      content: 'Bu aksesuar tipini silmek istediğinize emin misiniz?',
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSaving(true)
        try {
          await aksesuarTipiApi.delete(dbId)
          message.success('Aksesuar tipi silindi')
          handleYeni()
        } catch { message.error('Silme sırasında hata oluştu') }
        finally { setSaving(false) }
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
          <div className="!p-4">
            <div className="!max-w-lg !space-y-3">
              <div className="!flex !items-center !gap-2">
                <label className="!text-[10px] !font-semibold !uppercase !w-20 !text-right">Adı</label>
                <Input size="small" value={form.ad} onChange={(e) => set('ad', e.target.value)} className="!text-[11px]" />
              </div>
              <div className="!flex !items-center !gap-2">
                <label className="!text-[10px] !font-semibold !uppercase !w-20 !text-right">Numaratör Ön Ek</label>
                <Input size="small" value={form.onEk} onChange={(e) => set('onEk', e.target.value)} className="!w-24 !text-[11px]" />
              </div>
              <div className="!flex !items-center !gap-2">
                <label className="!text-[10px] !font-semibold !uppercase !w-20 !text-right">Durum</label>
                <Switch checked={form.kullanimda} onChange={(v) => set('kullanimda', v)} />
                <span className="!text-[11px]">{form.kullanimda ? 'Aktif' : 'Pasif'}</span>
              </div>
            </div>
          </div>
        </Spin>
      </div>
    </div>
  )
}