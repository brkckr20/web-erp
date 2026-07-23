'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input, Switch, App, Spin } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import { grupApi } from '@/lib/grup-api'

interface GrupFormData {
  kod: string
  ad: string
  kullanimda: boolean
  aciklama: string
}

const emptyData: GrupFormData = {
  kod: '',
  ad: '',
  kullanimda: true,
  aciklama: '',
}

interface GrupKartiProps {
  isNew?: boolean
  kod?: string
}

export default function GrupKarti({ isNew, kod }: GrupKartiProps) {
  const { message, modal } = App.useApp()
  const [form, setForm] = useState<GrupFormData>(emptyData)
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
      const data = await grupApi.getByKod(kod)
      setId(data.id)
      setForm({
        kod: data.kod,
        ad: data.ad,
        kullanimda: data.kullanimda,
        aciklama: data.aciklama ?? '',
      })
    } catch {
      message.warning('Kayıt bulunamadı')
    } finally {
      setLoading(false)
    }
  }, [])

  const set = <K extends keyof GrupFormData>(key: K, value: GrupFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleYeni = () => {
    setId(null)
    setForm(emptyData)
  }

  const handleKaydet = async () => {
    if (!form.kod.trim()) {
      message.warning('Grup kodu zorunludur')
      return
    }
    if (!form.ad.trim()) {
      message.warning('Grup adı zorunludur')
      return
    }
    setSaving(true)
    try {
      if (id) {
        await grupApi.update(id, form)
        message.success('Grup güncellendi')
      } else {
        const created = await grupApi.create(form)
        setId(created.id)
        message.success('Grup oluşturuldu')
      }
    } catch (e: any) {
      if (e?.message) {
        try {
          const parsed = JSON.parse(e.message)
          message.error(parsed.message || 'Kayıt sırasında hata oluştu')
        } catch {
          message.error(e.message)
        }
      } else {
        message.error('Kayıt sırasında hata oluştu')
      }
    } finally {
      setSaving(false)
    }
  }

  const handlePrevious = async () => {
    try {
      const list = await grupApi.list()
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
      const list = await grupApi.list()
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
      title: 'Grup Sil',
      content: 'Bu grubu silmek istediğinize emin misiniz?',
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSaving(true)
        try {
          await grupApi.delete(id)
          message.success('Grup silindi')
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
                <label className="!text-[11px] !font-semibold !text-[#333] !uppercase !w-16">Kodu</label>
                <Input
                  size="small"
                  suffix={
                    <SearchOutlined
                      style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }}
                    />
                  }
                  value={form.kod}
                  onChange={(e) => set('kod', e.target.value)}
                  className="!w-32 !text-[11px]"
                />
              </div>
            </div>
            <div className="!flex !items-center !gap-4 !mt-1.5">
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[11px] !font-semibold !text-[#333] !uppercase !w-16">Adı</label>
                <Input size="small" value={form.ad} onChange={(e) => set('ad', e.target.value)} className="!w-[200px] !text-[11px]" />
              </div>
              <Switch checked={form.kullanimda} onChange={(checked) => set('kullanimda', checked)} />
              <span className="!text-[11px]">Kullanımda</span>
            </div>
          </div>

          <div className="!overflow-y-auto !overflow-x-hidden !flex-1 !p-3">
            <div className="!w-full max-w-[600px]">
              <div className="!border !border-gray-200 !rounded-sm !p-3">
                <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">Grup Detay</div>
                <div className="!space-y-2.5">
                  <FormField label="Açıklama">
                    <Input.TextArea size="small" value={form.aciklama} onChange={(e) => set('aciklama', e.target.value)} className="!text-[11px]" rows={3} />
                  </FormField>
                </div>
              </div>
            </div>
          </div>
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
