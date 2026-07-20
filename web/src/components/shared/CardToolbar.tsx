'use client'

import { Button } from 'antd'
import {
  PlusOutlined,
  SaveOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  DeleteOutlined,
  PrinterOutlined,
} from '@ant-design/icons'

export interface ToolbarButton {
  key: string
  label: string
  icon?: React.ReactNode
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  type?: 'default' | 'primary'
  hidden?: boolean
}

const defaultIconMap: Record<string, React.ReactNode> = {
  new: <PlusOutlined />,
  save: <SaveOutlined />,
  previous: <StepBackwardOutlined />,
  next: <StepForwardOutlined />,
  delete: <DeleteOutlined />,
  report: <PrinterOutlined />,
}

export function createToolbarButtons(
  handlers: {
    onNew?: () => void
    onSave?: () => void
    onPrevious?: () => void
    onNext?: () => void
    onDelete?: () => void
    onReport?: () => void
  },
  overrides?: Partial<Record<string, Omit<ToolbarButton, 'key'>>>,
): ToolbarButton[] {
  const defs: { key: string; label: string; type?: 'default' | 'primary'; danger?: boolean; condition?: boolean }[] = [
    { key: 'new', label: 'Yeni' },
    { key: 'save', label: 'Kaydet', type: 'primary' },
    { key: 'previous', label: 'Önceki' },
    { key: 'next', label: 'Sonraki' },
    { key: 'report', label: 'Rapor' },
    { key: 'delete', label: 'Sil', danger: true },
  ]

  const handlerMap: Record<string, () => void> = {
    new: handlers.onNew ?? (() => {}),
    save: handlers.onSave ?? (() => {}),
    previous: handlers.onPrevious ?? (() => {}),
    next: handlers.onNext ?? (() => {}),
    report: handlers.onReport ?? (() => {}),
    delete: handlers.onDelete ?? (() => {}),
  }

  return defs.map((def) => {
    const override = overrides?.[def.key]
    return {
      key: def.key,
      label: override?.label ?? def.label,
      icon: override?.icon ?? defaultIconMap[def.key],
      onClick: override?.onClick ?? handlerMap[def.key],
      disabled: override?.disabled ?? false,
      danger: override?.danger ?? def.danger ?? false,
      type: override?.type ?? def.type ?? 'default',
      hidden: override?.hidden ?? !handlerMap[def.key],
    }
  })
}

interface CardToolbarProps {
  buttons: ToolbarButton[]
  className?: string
}

export default function CardToolbar({ buttons, className = '' }: CardToolbarProps) {
  return (
    <div className={`!flex !items-center !gap-1.5 !px-3 !py-1.5 !border-b !border-gray-200 !bg-[#F8F8F8] ${className}`}>
      {buttons
        .filter((b) => !b.hidden)
        .map((btn) => (
          <Button
            key={btn.key}
            type={btn.type}
            size="small"
            icon={btn.icon}
            onClick={btn.onClick}
            disabled={btn.disabled}
            danger={btn.danger}
            className="!text-[11px] !h-[26px]"
          >
            {btn.label}
          </Button>
        ))}
    </div>
  )
}
