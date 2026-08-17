'use client'

import { Tabs, Input, App } from 'antd'
import { useState, useEffect } from 'react'
import CardToolbar from '@/components/shared/CardToolbar'
import { parametreApi } from '@/lib/parametre-api'

const tabItems = [{ key: 'genel', label: 'Genel' }]

const tabClass =
  '!px-3 !pt-2 !flex-1 !flex !flex-col !min-h-0 ' +
  '[&_.ant-tabs-content-holder]:!flex [&_.ant-tabs-content-holder]:!flex-col [&_.ant-tabs-content-holder]:!flex-1 [&_.ant-tabs-content-holder]:!min-h-0 ' +
  '[&_.ant-tabs-content]:!flex-1 [&_.ant-tabs-content]:!min-h-0 [&_.ant-tabs-tabpane]:!h-full ' +
  '[&_.ant-tabs-nav]:!mb-2 [&_.ant-tabs-nav]:!border-b [&_.ant-tabs-nav]:!border-gray-200 [&_.ant-tabs-nav]:!flex-shrink-0 ' +
  '[&_.ant-tabs-tab]:!text-[11px] [&_.ant-tabs-tab]:!px-2 [&_.ant-tabs-tab]:!py-1 [&_.ant-tabs-tab]:!bg-[#E0E0E0] [&_.ant-tabs-tab]:!border [&_.ant-tabs-tab]:!border-gray-200 [&_.ant-tabs-tab]:!text-[#333] ' +
  '[&_.ant-tabs-tab-active]:!bg-white [&_.ant-tabs-tab-active]:!border-t-2 [&_.ant-tabs-tab-active]:!border-t-[#FF9933] [&_.ant-tabs-tab-active]:!text-[#FF9933] ' +
  '[&_.ant-tabs-ink-bar]:!hidden'

export default function SiparisParametreleri() {
  const { message } = App.useApp()
  const [kesimFazlasi, setKesimFazlasi] = useState('')
  const [yukluyor, setYukluyor] = useState(true)
  const [kaydediyor, setKaydediyor] = useState(false)

  useEffect(() => {
    parametreApi
      .get('siparis', 'kesimFazlasi')
      .then((p) => setKesimFazlasi(p.deger ?? ''))
      .catch(() => setKesimFazlasi(''))
      .finally(() => setYukluyor(false))
  }, [])

  const handleKaydet = async () => {
    setKaydediyor(true)
    try {
      await parametreApi.set('siparis', 'kesimFazlasi', kesimFazlasi.trim())
      message.success('Parametreler kaydedildi')
    } catch {
      message.error('Kaydedilirken hata oluştu')
    } finally {
      setKaydediyor(false)
    }
  }

  const toolbarButtons = [
    {
      key: 'save',
      label: 'Kaydet',
      type: 'primary' as const,
      icon: undefined,
      onClick: handleKaydet,
      disabled: kaydediyor,
      hidden: false,
    },
  ]

  return (
    <div className="!h-full !flex !flex-col">
      <CardToolbar buttons={toolbarButtons} />
      <div className="!bg-white !border !border-gray-200 !rounded-sm !flex-1 !flex !flex-col !overflow-hidden">
        <Tabs
          size="small"
          tabBarGutter={2}
          defaultActiveKey="genel"
          className={tabClass}
          items={tabItems.map((t) => ({
            key: t.key,
            label: t.label,
            children: (
              <div className="!p-4">
                <div className="!w-full">
                  <div className="!border !border-gray-200 !rounded-sm !p-2">
                    <div className="!flex !items-center !gap-2">
                      <label className="!text-[10px] !font-semibold !uppercase !w-28 !text-right !shrink-0">Kesim Fazlası</label>
                      <Input
                        size="small"
                        placeholder="Örn: %5"
                        value={kesimFazlasi}
                        onChange={(e) => setKesimFazlasi(e.target.value)}
                        disabled={yukluyor}
                        className="!w-32 !text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ),
          }))}
        />
      </div>
    </div>
  )
}
