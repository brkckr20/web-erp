'use client'

import { Tabs } from 'antd'
import { Tab } from '@/data/modules'

interface TabBarProps {
  tabs: Tab[]
  activeKey: string | null
  onTabChange: (key: string) => void
  onTabClose: (key: string) => void
}

export default function TabBar({ tabs, activeKey, onTabChange, onTabClose }: TabBarProps) {
  if (tabs.length === 0) return null

  return (
    <div className="!bg-white !border-b !border-gray-200 !px-1">
      <Tabs
        activeKey={activeKey ?? undefined}
        onChange={onTabChange}
        type="editable-card"
        hideAdd
        onEdit={(targetKey) => onTabClose(targetKey as string)}
        size="small"
        items={tabs.map((tab) => ({
          key: tab.key,
          label: (
            <span className="!text-[11px] !flex !items-center !gap-1">
              {tab.isForm && <span className="!text-[10px] !text-gray-300">📄</span>}
              {tab.label}
            </span>
          ),
          closable: true,
        }))}
        className="!mb-0 [&_.ant-tabs-nav]:!mb-0 [&_.ant-tabs-tab]:!px-3 [&_.ant-tabs-tab]:!py-1 [&_.ant-tabs-tab]:!text-[11px] [&_.ant-tabs-tab-btn]:!text-[11px] [&_.ant-tabs-nav]:!min-h-[32px] [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:!text-[#f57c00] [&_.ant-tabs-tab-remove]:!flex [&_.ant-tabs-tab-remove]:!items-center [&_.ant-tabs-tab-remove]:!justify-center [&_.ant-tabs-tab-remove]:!p-0.5 [&_.ant-tabs-tab-remove]:!rounded-full [&_.ant-tabs-tab-remove:hover]:!bg-[#FF9933] [&_.ant-tabs-tab-remove:hover]:!text-white"
      />
    </div>
  )
}
