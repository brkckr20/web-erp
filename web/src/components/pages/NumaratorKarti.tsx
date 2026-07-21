'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input, Switch, App, Spin } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import { numaratorApi } from '@/lib/numarator-api'

interface FormData {
  ad: string
  onEk: string
  sonNo: number
  kullanimda: boolean
}

const emptyData: FormData = {
  ad: '',
  onEk: '',
  sonNo: 0,
  kullanimda: true,
}

interface NumaratorKartiProps {
  isNew?: boolean
  id?: number
}

export default function NumaratorKarti({ isNew, id }: NumaratorKartiProps) {
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
      const data = await numaratorApi.get(loadId)
      setDbId(data.id)
      setForm({
        ad: data.ad,
        onEk: data.onEk,
        sonNo: data.sonNo,
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
    if (!form.onEk.trim()) { message.warning('Ön Ek alanı zorunludur'); return }
    setSaving(true)
    try {
      if (dbId) {
        await numaratorApi.update(dbId, form)
        message.success('Numaratör güncellendi')
      } else {
        const created = await numaratorApi.create(form)
        setDbId(created.id)
        message.success('Numaratör oluşturuldu')
      }
    } catch {
      message.error('Kayıt sırasında hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handlePrevious = async () => {
    try {
      const list = await numaratorApi.list()
      const idx = list.findIndex((d) => d.id === dbId)
      if (idx <= 0) { message.info('İlk kayıttasınız'); return }
      await loadById(list[idx - 1].id)
    } catch { message.warning('Önceki kayıt yüklenemedi') }
  }

  const handleNext = async () => {
    try {
      const list = await numaratorApi.list()
      const idx = list.findIndex((d) => d.id === dbId)
      if (idx < 0 || idx >= list.length - 1) { message.info('Son kayıttasınız'); return }
      await loadById(list[idx + 1].id)
    } catch { message.warning('Sonraki kayıt yüklenemedi') }
  }

  const handleSil = () => {
    if (!dbId) return
    modal.confirm({
      title: 'Numaratör Sil',
      content: 'Bu numaratörü silmek istediğinize emin misiniz?',
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSaving(true)
        try {
          await numaratorApi.delete(dbId)
          message.success('Numaratör silindi')
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
                <label className="!text-[10px] !font-semibold !uppercase !w-20 !text-right">Ad</label>
                <Input size="small" value={form.ad} onChange={(e) => set('ad', e.target.value)} className="!text-[11px]" />
              </div>
              <div className="!flex !items-center !gap-2">
                <label className="!text-[10px] !font-semibold !uppercase !w-20 !text-right">Ön Ek</label>
                <Input size="small" value={form.onEk} onChange={(e) => set('onEk', e.target.value)} className="!w-24 !text-[11px]" />
              </div>
              <div className="!flex !items-center !gap-2">
                <label className="!text-[10px] !font-semibold !uppercase !w-20 !text-right">Son No</label>
                <Input size="small" value={form.sonNo} disabled className="!w-24 !text-[11px]" />
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
