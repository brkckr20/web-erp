'use client'

import { Tabs } from 'antd'
import FasonTipleri from '@/components/pages/FasonTipleri'

const tabItems = [
  { key: 'on-deger', label: 'Ön Değer' },
  { key: 'genel', label: 'Genel' },
  { key: 'maliyet', label: 'Maliyet' },
  { key: 'depo', label: 'Depo' },
  { key: 'paketleme', label: 'Paketleme' },
  { key: 'uretim', label: 'Üretim' },
  { key: 'fason-tipleri', label: 'Fason Tipleri' },
  { key: 'sayim', label: 'Sayım' },
  { key: 'varyant', label: 'Varyant' },
  { key: 'fiyat-tanimi-ondegerleri', label: 'Fiyat Tanımı Öndeğerleri' },
  { key: 'barkod', label: 'Barkod' },
]

const tabClass =
  '!px-3 !pt-2 !flex-1 !flex !flex-col !min-h-0 ' +
  '[&_.ant-tabs-content-holder]:!flex [&_.ant-tabs-content-holder]:!flex-col [&_.ant-tabs-content-holder]:!flex-1 [&_.ant-tabs-content-holder]:!min-h-0 ' +
  '[&_.ant-tabs-content]:!flex-1 [&_.ant-tabs-content]:!min-h-0 [&_.ant-tabs-tabpane]:!h-full ' +
  '[&_.ant-tabs-nav]:!mb-2 [&_.ant-tabs-nav]:!border-b [&_.ant-tabs-nav]:!border-gray-200 [&_.ant-tabs-nav]:!flex-shrink-0 ' +
  '[&_.ant-tabs-tab]:!text-[11px] [&_.ant-tabs-tab]:!px-2 [&_.ant-tabs-tab]:!py-1 [&_.ant-tabs-tab]:!bg-[#E0E0E0] [&_.ant-tabs-tab]:!border [&_.ant-tabs-tab]:!border-gray-200 [&_.ant-tabs-tab]:!text-[#333] ' +
  '[&_.ant-tabs-tab-active]:!bg-white [&_.ant-tabs-tab-active]:!border-t-2 [&_.ant-tabs-tab-active]:!border-t-[#FF9933] [&_.ant-tabs-tab-active]:!text-[#FF9933] ' +
  '[&_.ant-tabs-ink-bar]:!hidden'

export default function MalzemeYonetimParametreleri() {
  return (
    <div className="!h-full !flex !flex-col">
      <div className="!bg-white !border !border-gray-200 !rounded-sm !flex-1 !flex !flex-col !overflow-hidden">
        <Tabs
          size="small"
          tabBarGutter={2}
          defaultActiveKey="on-deger"
          className={tabClass}
          items={tabItems.map((t) => ({
            key: t.key,
            label: t.label,
            children: t.key === 'fason-tipleri' ? <FasonTipleri /> : <div className="!p-4 !min-h-[300px]">{t.label} içeriği</div>,
          }))}
        />
      </div>
    </div>
  )
}
