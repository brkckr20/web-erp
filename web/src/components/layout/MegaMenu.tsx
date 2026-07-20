'use client'

import { useCallback, useMemo } from 'react'
import { App } from 'antd'
import { Module, Tab, modules } from '@/data/modules'
import { useAuth } from '@/context/AuthContext'
import { getShortcuts, toggleShortcut, isShortcut, ShortcutItem } from '@/lib/shortcuts'

interface MegaMenuProps {
  module: Module | null
  onClose: () => void
  onSubItemClick: (tab: Tab) => void
}

export default function MegaMenu({ module, onClose, onSubItemClick }: MegaMenuProps) {
  const { kullanici } = useAuth()
  const { message } = App.useApp()
  const userCode = kullanici?.girisKodu || kullanici?.kod || ''

  const allShortcuts = useMemo(() => {
    if (!userCode) return []
    return getShortcuts(userCode)
  }, [userCode])

  const groupedShortcuts = useMemo(() => {
    const grouped: { modLabel: string; items: ShortcutItem[] }[] = []
    for (const item of allShortcuts) {
      const mod = modules.find((m) => m.key === item.moduleKey)
      const modLabel = mod?.label || item.moduleKey
      const existing = grouped.find((g) => g.modLabel === modLabel)
      if (existing) {
        existing.items.push(item)
      } else {
        grouped.push({ modLabel, items: [item] })
      }
    }
    return grouped
  }, [allShortcuts])

  if (!module) return null

  const handleClick = (item: { key: string; label: string; isForm?: boolean }, modKey?: string) => {
    onSubItemClick({
      key: item.key,
      label: item.label,
      moduleKey: modKey || module.key,
      isForm: item.isForm,
    })
    onClose()
  }

  const handleStarToggle = useCallback((e: React.MouseEvent, item: { key: string; label: string; isForm?: boolean }, modKey: string) => {
    e.stopPropagation()
    if (!userCode) return
    const next = toggleShortcut(userCode, {
      key: item.key,
      label: item.label,
      moduleKey: modKey,
      isForm: item.isForm,
    })
    const exists = next.some((s) => s.key === item.key)
    message.success(exists ? 'Kısayollara eklendi' : 'Kısayollardan çıkarıldı')
  }, [userCode])

  const renderItemRow = (item: { key: string; label: string; isForm?: boolean; isFavorite?: boolean }, modKey: string, width = '160px') => {
    const starred = userCode ? isShortcut(userCode, item.key) : !!item.isFavorite
    return (
      <div key={item.key} className="!flex !items-center !group" style={{ width }}>
        <button
          onClick={(e) => handleStarToggle(e, item, modKey)}
          className="!flex-shrink-0 !w-5 !h-5 !flex !items-center !justify-center !bg-transparent !border-none !cursor-pointer !rounded hover:!bg-gray-100"
          title={starred ? 'Kısayollardan çıkar' : 'Kısayollara ekle'}
        >
          <span className={`!text-[10px] !leading-none ${starred ? '!text-[#f57c00]' : '!text-gray-300 group-hover:!text-gray-400'}`}>
            {starred ? '★' : '☆'}
          </span>
        </button>
        <button
          onClick={() => handleClick(item, modKey)}
          className="!flex-1 !flex !items-center !gap-1.5 !px-1.5 !py-1 !text-[12px] !text-[#374151] !rounded-sm !bg-transparent !border-none !cursor-pointer !text-left hover:!bg-gray-100 !leading-tight !whitespace-nowrap"
        >
          <span>{item.label}</span>
        </button>
      </div>
    )
  }

  return (
    <>
      <div
        className="!fixed !inset-0 !bg-black/40 !z-30 animate-[fadeIn_0.15s_ease-out]"
        onClick={onClose}
      />

      <div
        className="!fixed !left-[178px] !top-0 !h-screen !z-40 !shadow-2xl animate-[slideInLeft_0.2s_ease-out]"
        style={{ width: 'auto', minWidth: 200 }}
      >
        <div className="!h-10 !bg-[#1e2630] !flex !items-center !px-4 !gap-2">
          <span className="!text-sm">{module.key === 'kisayollar' ? '⭐' : module.icon}</span>
          <span className="!text-white !font-semibold !text-xs !tracking-wide">{module.label}</span>
          <button
            onClick={onClose}
            className="!ml-auto !text-white/30 !hover:text-white !text-xs !bg-transparent !border-none !cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="!bg-white !p-3" style={{ height: 'calc(100vh - 40px)' }}>
          <div
            className="!flex !flex-col !flex-wrap !content-start"
            style={{ maxHeight: 'calc(100vh - 64px)', width: 'fit-content', gap: '2px 16px' }}
          >
            {module.key === 'kisayollar' ? (
              groupedShortcuts.length > 0 ? (
                groupedShortcuts.map((group) => (
                  <div key={group.modLabel} className="!w-[160px] !mb-2">
                    <div className="!w-full !bg-[#f0f1f3] !px-2 !py-1.5 !rounded-sm !mb-1">
                      <div className="!text-[10px] !font-bold !text-[#374151] !uppercase !tracking-wider !whitespace-nowrap">
                        {group.modLabel}
                      </div>
                    </div>
                    {group.items.map((item) => renderItemRow(item, item.moduleKey))}
                  </div>
                ))
              ) : (
                <div className="!w-[160px] !text-[11px] !text-[#9ca3af] !px-2 !py-4 !text-center">
                  Henüz kısayol eklenmedi
                </div>
              )
            ) : (
              module.categories.flatMap((cat) => [
                <div key={cat.title + '-h'} className="!w-[160px] !bg-[#f0f1f3] !px-2 !py-1.5 !rounded-sm !mb-1 !mt-2 first:!mt-0">
                  <div className="!text-[10px] !font-bold !text-[#374151] !uppercase !tracking-wider !whitespace-nowrap">
                    {cat.title}
                  </div>
                </div>,
                ...cat.items.map((item) => renderItemRow(item, module.key)),
              ])
            )}
          </div>
        </div>
      </div>
    </>
  )
}
