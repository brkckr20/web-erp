'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input, Switch, InputNumber, App, Spin, Upload } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import { dovizApi, type Doviz } from '@/lib/doviz-api'

export interface DovizFormData {
  kod: string
  altKod: string
  ad: string
  sira: number
  resim: string
  kullanimda: boolean
}

const emptyData: DovizFormData = {
  kod: '',
  altKod: '',
  ad: '',
  sira: 0,
  resim: '',
  kullanimda: true,
}

interface DovizKartiProps {
  isNew?: boolean
  kod?: string
}

export default function DovizKarti({ isNew, kod }: DovizKartiProps) {
  const { message, modal } = App.useApp()
  const [form, setForm] = useState<DovizFormData>(emptyData)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (kod && !isNew) {
      loadByKod(kod)
    } else {
      setForm(emptyData)
    }
  }, [kod, isNew])

  const loadByKod = useCallback(async (kod: string) => {
    setLoading(true)
    try {
      const data = await dovizApi.getByKod(kod)
      setForm({
        kod: data.kod,
        altKod: data.altKod ?? '',
        ad: data.ad,
        sira: data.sira,
        resim: data.resim ?? '',
        kullanimda: data.kullanimda,
      })
    } catch {
      message.warning('Kayıt bulunamadı')
    } finally {
      setLoading(false)
    }
  }, [])

  const set = <K extends keyof DovizFormData>(key: K, value: DovizFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleYeni = () => {
    setForm(emptyData)
  }

  const handleKaydet = async () => {
    if (!form.kod.trim()) {
      message.warning('Döviz kodu zorunludur')
      return
    }
    if (!form.ad.trim()) {
      message.warning('Döviz adı zorunludur')
      return
    }
    setSaving(true)
    try {
      if (kod) {
        await dovizApi.update(kod, form)
        message.success('Döviz güncellendi')
      } else {
        await dovizApi.create(form as any)
        message.success('Döviz oluşturuldu')
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
      const list = await dovizApi.list()
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
      const list = await dovizApi.list()
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
    if (!form.kod) return
    modal.confirm({
      title: 'Döviz Sil',
      content: 'Bu dövizi silmek istediğinize emin misiniz?',
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSaving(true)
        try {
          await dovizApi.remove(form.kod)
          message.success('Döviz silindi')
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
        <div className="!flex !flex-col !px-3 !py-2 !border-b !border-gray-200 !flex-shrink-0">
          <div className="!flex !items-center !gap-4">
            <div className="!flex !items-center !gap-1.5">
              <label className="!text-[11px] !font-semibold !text-[#333] !uppercase !w-20">Döviz Kodu</label>
              <Input
                size="small"
                value={form.kod}
                onChange={(e) => set('kod', e.target.value)}
                className="!w-32 !text-[11px]"
              />
            </div>
            <Switch checked={form.kullanimda} onChange={(checked) => set('kullanimda', checked)} />
            <span className="!text-[11px]">Kullanımda</span>
          </div>
        </div>

        <Spin spinning={loading}>
          <div className="!overflow-y-auto !overflow-x-hidden !flex-1 !p-3">
            <div className="!w-full max-w-[600px]">
              <div className="!border !border-gray-200 !rounded-sm !p-3">
                <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">Döviz Detay</div>
                <div className="!space-y-2.5">
                  <FormField label="Alt Kodu">
                    <Input size="small" value={form.altKod} onChange={(e) => set('altKod', e.target.value)} className="!text-[11px]" />
                  </FormField>
                  <FormField label="Adı" required>
                    <Input
                      size="small"
                      value={form.ad}
                      onChange={(e) => set('ad', e.target.value)}
                      className="!text-[11px]"
                    />
                  </FormField>
                  <FormField label="Sıra">
                    <InputNumber
                      size="small"
                      value={form.sira}
                      onChange={(v) => set('sira', v ?? 0)}
                      className="!text-[11px]"
                      style={{ width: 120 }}
                    />
                  </FormField>
                  <FormField label="Resim">
                    <div className="!flex !items-center !gap-2">
                      <Input
                        size="small"
                        value={form.resim}
                        onChange={(e) => set('resim', e.target.value)}
                        className="!text-[11px] !flex-1"
                        placeholder="İkon URL'si veya base64"
                      />
                    </div>
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
