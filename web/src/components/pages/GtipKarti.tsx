'use client'

import { useState, useEffect } from 'react'
import { Input, App, Spin } from 'antd'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import { gtipApi, type Gtip } from '@/lib/gtip-api'

interface GtipKartiProps {
  isNew?: boolean
  kod?: string
}

export default function GtipKarti({ isNew, kod }: GtipKartiProps) {
  const { message, modal } = App.useApp()
  const [gtip, setGtip] = useState<Gtip | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const initNew = () => ({ id: 0, kod: '', ad: '', kullanimda: true, createdAt: '', updatedAt: '' })

  const set = (key: keyof Gtip, value: unknown) =>
    setGtip((prev) => (prev ? { ...prev, [key]: value } : { ...initNew(), [key]: value }))

  useEffect(() => {
    if (kod) loadByKod(kod)
    else if (isNew) handleYeni()
  }, [kod])

  const loadByKod = async (v: string) => {
    setLoading(true)
    try {
      const list = await gtipApi.list()
      const found = list.find((g) => g.kod === v)
      if (found) setGtip(found)
      else message.warning('GTİP bulunamadı')
    } catch {
      message.warning('GTİP bulunamadı')
    } finally {
      setLoading(false)
    }
  }

  const handleYeni = () => {
    setGtip(null)
  }

  const handleKaydet = async () => {
    if (!gtip) return
    setSaving(true)
    try {
      if (isNew) {
        await gtipApi.create({ kod: gtip.kod, ad: gtip.ad, kullanimda: gtip.kullanimda })
      } else {
        await gtipApi.update(gtip.id, { kod: gtip.kod, ad: gtip.ad, kullanimda: gtip.kullanimda })
      }
      message.success('GTİP kaydedildi')
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Kayıt sırasında hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handleSil = () => {
    if (!gtip?.id) return
    modal.confirm({
      title: 'GTİP Sil',
      content: 'Bu GTİP kaydını silmek istediğinize emin misiniz?',
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSaving(true)
        try {
          await gtipApi.delete(gtip.id)
          message.success('GTİP silindi')
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
    onDelete: handleSil,
  })

  return (
    <div className="!h-full !flex !flex-col">
      <div className="!bg-white !border !border-gray-200 !rounded-sm !flex-1 !flex !flex-col !overflow-hidden">
        <CardToolbar buttons={toolbarButtons} />
        <Spin spinning={loading}>
          <div className="!p-4">
            <div className="!border !border-gray-200 !rounded-sm !p-4 !w-[550px]">
              <div className="!flex !flex-col !gap-3">
                <div className="!flex !items-center !gap-2">
                  <label className="!text-[10px] !font-semibold !uppercase !w-28 !text-right !shrink-0 !text-[#333]">GTİP No</label>
                  <Input size="small" value={gtip?.kod ?? ''} onChange={(e) => set('kod', e.target.value)} className="!w-[200px] !text-[11px]" />
                </div>
                <div className="!flex !items-center !gap-2">
                  <label className="!text-[10px] !font-semibold !uppercase !w-28 !text-right !shrink-0 !text-[#333]">Açıklama</label>
                  <Input size="small" value={gtip?.ad ?? ''} onChange={(e) => set('ad', e.target.value)} className="!w-full !text-[11px]" />
                </div>
              </div>
            </div>
          </div>
        </Spin>
      </div>
    </div>
  )
}
