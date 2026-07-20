'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, Input, Checkbox, Row, Col, App, Spin } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import { hataTanimApi } from '@/lib/hata-tanim-api'
import type { HataTanim, CreateHataTanim } from '@/lib/hata-tanim-api'

const emptyData: CreateHataTanim = {
  hataKodu: '',
  hataAdi: '',
  ozelKod: '',
  kullanimda: true,
}

interface HataTanimKartiProps {
  isNew?: boolean
  kod?: string
}

export default function HataTanimKarti({ isNew, kod }: HataTanimKartiProps) {
  const { message, modal } = App.useApp()
  const [form, setForm] = useState<CreateHataTanim>(emptyData)
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
      const data = await hataTanimApi.getByKod(kod)
      setId(data.id)
      setForm({
        hataKodu: data.hataKodu,
        hataAdi: data.hataAdi,
        ozelKod: data.ozelKod ?? '',
        kullanimda: data.kullanimda,
      })
    } catch {
      message.warning('Kod bulunamadı')
    } finally {
      setLoading(false)
    }
  }, [])

  const set = <K extends keyof CreateHataTanim>(key: K, value: CreateHataTanim[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleKodAra = async () => {
    if (!form.hataKodu.trim()) return
    await loadByKod(form.hataKodu.trim())
  }

  const handleKodKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleKodAra()
  }

  const handleYeni = () => {
    setId(null)
    setForm(emptyData)
  }

  const handleKaydet = async () => {
    if (!form.hataKodu.trim()) {
      message.warning('Hata kodu alanı zorunludur')
      return
    }
    if (!form.hataAdi.trim()) {
      message.warning('Hata adı alanı zorunludur')
      return
    }
    setSaving(true)
    try {
      if (id) {
        await hataTanimApi.update(id, form)
        message.success('Hata tanımı başarıyla güncellendi')
      } else {
        const created = await hataTanimApi.create(form)
        setId(created.id)
        message.success('Hata tanımı başarıyla oluşturuldu')
      }
    } catch {
      message.error('Kayıt sırasında hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handlePrevious = async () => {
    try {
      const list = await hataTanimApi.list()
      const idx = list.findIndex((d) => d.hataKodu === form.hataKodu)
      if (idx <= 0) {
        message.info('İlk kayıttasınız')
        return
      }
      await loadByKod(list[idx - 1].hataKodu)
    } catch {
      message.warning('Önceki kayıt yüklenemedi')
    }
  }

  const handleNext = async () => {
    try {
      const list = await hataTanimApi.list()
      const idx = list.findIndex((d) => d.hataKodu === form.hataKodu)
      if (idx < 0 || idx >= list.length - 1) {
        message.info('Son kayıttasınız')
        return
      }
      await loadByKod(list[idx + 1].hataKodu)
    } catch {
      message.warning('Sonraki kayıt yüklenemedi')
    }
  }

  const handleSil = () => {
    if (!id) return
    modal.confirm({
      title: 'Hata Tanımı Sil',
      content: 'Bu hata tanımını silmek istediğinize emin misiniz?',
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSaving(true)
        try {
          await hataTanimApi.remove(id)
          message.success('Hata tanımı silindi')
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
                <label className="!text-[11px] !font-semibold !text-[#333] !uppercase !w-16">Hata Kodu</label>
                <Input
                  size="small"
                  suffix={
                    <SearchOutlined
                      style={{ fontSize: 12, color: '#7A7A7A', cursor: 'pointer' }}
                      onClick={handleKodAra}
                    />
                  }
                  value={form.hataKodu}
                  onChange={(e) => set('hataKodu', e.target.value)}
                  onKeyDown={handleKodKeyDown}
                  className="!w-32 !text-[11px]"
                />
              </div>
            </div>
            <div className="!flex !items-center !gap-4 !mt-1.5">
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[11px] !font-semibold !text-[#333] !uppercase !w-16">Hata Adı</label>
                <Input size="small" value={form.hataAdi} onChange={(e) => set('hataAdi', e.target.value)} className="!w-[200px] !text-[11px]" />
              </div>
              <Checkbox checked={form.kullanimda} onChange={(e) => set('kullanimda', e.target.checked)} className="!text-[11px]">
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
                        <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-3">Hata Tanım Bilgileri</div>
                        <div className="!space-y-2.5">
                          <FormField label="Özel Kod">
                            <Input size="small" value={form.ozelKod} onChange={(e) => set('ozelKod', e.target.value)} className="!text-[11px]" />
                          </FormField>
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
