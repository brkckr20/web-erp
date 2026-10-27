'use client'

import { Menu, type MenuProps } from 'antd'

interface SagTikMenuProps {
  position: { x: number; y: number } | null
  items: MenuProps['items']
  onClose: () => void
}

export default function SagTikMenu({ position, items, onClose }: SagTikMenuProps) {
  if (!position) return null
  const x = Math.min(position.x, window.innerWidth - 220)
  const y = Math.min(position.y, window.innerHeight - 160)
  return (
    <div className="fixed inset-0 z-[9999]" onClick={onClose}>
      <div className="absolute" style={{ left: x, top: y }} onClick={(e) => e.stopPropagation()}>
        <Menu items={items} mode="vertical" />
      </div>
    </div>
  )
}
