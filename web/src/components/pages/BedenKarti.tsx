'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input, InputNumber, Switch, App, Spin } from 'antd'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import { bedenApi } from '@/lib/beden-api'

interface BedenFormData {
  kod: string
  sira: number
  kullanimda: boolean
}

const emptyData: BedenFormData = {
  kod: '',
  sira: 0,
  kullanimda: true,
}

interface BedenKartiProps {
  isNew?: boolean
  kod?: string
}

export default function BedenKarti({ isNew, kod }: BedenKartiProps) {
  const { message, modal } = App.useApp()
  const [form, setForm] = useState<BedenFormData>(emptyData)
  const [id, setId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (kod && !isNew) {
      loadByKod(kod)
    } else {
      setForm(emptyData)
      setId(null)
    }
  }, [kod, isNew])

  const loadByKod = useCallback(async (kod: string) => {
    setLoading(true)
    try {
      const list = await bedenApi.list()
      const data = list.find((b) => b.kod === kod)
      if (!data) throw new Error('Bulunamadı')
      setId(data.id)
      setForm({
        kod: data.kod,
        sira: data.sira,
        kullanimda: data.kullanimda,
      })
    } catch {
      message.warning('Kayıt bulunamadı')
    } finally {
      setLoading(false)
    }
  }, [])

  const set = <K extends keyof BedenFormData>(key: K, value: BedenFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleYeni = () => {
    setId(null)
    setForm(emptyData)
  }

  const handleKaydet = async () => {
    if (!form.kod.trim()) {
      message.warning('Beden kodu zorunludur')
      return
    }
    setSaving(true)
    try {
      if (id) {
        await bedenApi.update(id, form)
        message.success('Beden güncellendi')
      } else {
        const created = await bedenApi.create(form)
        setId(created.id)
        message.success('Beden oluşturuldu')
      }
    } catch (e: any) {
      message.error(e?.message || 'Kayıt sırasında hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handlePrevious = async () => {
    try {
      const list = await bedenApi.list()
      const idx = list.findIndex((d) => d.kod === form.kod)
      if (idx <= 0) { message.info('İlk kayıttasınız'); return }
      await loadByKod(list[idx - 1].kod)
    } catch { message.warning('Önceki kayıt yüklenemedi') }
  }

  const handleNext = async () => {
    try {
      const list = await bedenApi.list()
      const idx = list.findIndex((d) => d.kod === form.kod)
      if (idx < 0 || idx >= list.length - 1) { message.info('Son kayıttasınız'); return }
      await loadByKod(list[idx + 1].kod)
    } catch { message.warning('Sonraki kayıt yüklenemedi') }
  }

  const handleSil = () => {
    if (!id) return
    modal.confirm({
      title: 'Beden Sil',
      content: 'Bu bedeni silmek istediğinize emin misiniz?',
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSaving(true)
        try {
          await bedenApi.delete(id)
          message.success('Beden silindi')
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
          <div className="!flex !flex-col !px-3 !py-2 !border-b !border-gray-200 !flex-shrink-0">
            <div className="!flex !items-center !gap-4">
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[11px] !font-semibold !text-[#333] !uppercase !w-16">Kodu</label>
                <Input
                  size="small"
                  value={form.kod}
                  onChange={(e) => set('kod', e.target.value)}
                  className="!w-32 !text-[11px]"
                />
              </div>
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[11px] !font-semibold !text-[#333] !uppercase !w-12">Sıra</label>
                <InputNumber
                  size="small"
                  min={0}
                  value={form.sira}
                  onChange={(v) => set('sira', v ?? 0)}
                  className="!w-20 !text-[11px]"
                />
              </div>
              <Switch checked={form.kullanimda} onChange={(checked) => set('kullanimda', checked)} />
              <span className="!text-[11px]">Kullanımda</span>
            </div>
          </div>
        </Spin>
      </div>
    </div>
  )
}
