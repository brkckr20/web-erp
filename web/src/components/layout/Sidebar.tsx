'use client'

import { Menu, Avatar, Dropdown } from 'antd'
import { LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { modules, Module } from '@/data/modules'
import { useAuth } from '@/context/AuthContext'

interface SidebarProps {
  selectedModule: string | null
  onModuleSelect: (module: Module) => void
}

const iconMap: Record<string, React.ReactNode> = {
  '⭐': <span className="!text-[13px] !text-[#f57c00]">⭐</span>,
  '📦': <span className="!text-sm">📦</span>,
  '📋': <span className="!text-sm">📋</span>,
  '⚙️': <span className="!text-sm">⚙️</span>,
  '🛒': <span className="!text-sm">🛒</span>,
  '🚚': <span className="!text-sm">🚚</span>,
  '💰': <span className="!text-sm">💰</span>,
}

const kisaYollarMod: Module = {
  key: 'kisayollar',
  label: 'Kısayollarım',
  icon: '⭐',
  categories: [],
}

export default function Sidebar({ selectedModule, onModuleSelect }: SidebarProps) {
  const { kullanici, logout } = useAuth()
  const modItems = modules.filter((m) => m.key !== 'ayarlar')
  const settingsItem = modules.find((m) => m.key === 'ayarlar')

  const buildItems = (list: Module[]) =>
    list.map((m) => ({
      key: m.key,
      icon: iconMap[m.icon],
      label: (
        <span className="!text-[12px] !text-white/60 !block !leading-tight">
          {m.label}
        </span>
      ),
    }))

  const handleMenuClick = (key: string) => {
    const mod = key === 'kisayollar' ? kisaYollarMod : modules.find((m) => m.key === key)
    if (mod) onModuleSelect(mod)
  }

  return (
    <div
      style={{
        width: 178,
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        zIndex: 50,
        backgroundColor: '#121820',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="!h-10 !flex !items-center !gap-2 !px-3 !border-b !border-white/5 !flex-shrink-0">
        <span className="!text-white !text-sm !font-bold">X</span>
        <span className="!text-[10px] !text-white/30 !font-medium">ERP</span>
      </div>

      <div className="!flex-1 !overflow-y-auto">
        <Menu
          mode="inline"
          selectedKeys={selectedModule ? [selectedModule] : []}
          onClick={({ key }) => handleMenuClick(key)}
          items={buildItems([kisaYollarMod, ...modItems])}
          className="!bg-transparent !border-r-0 !pt-1
            [&_.ant-menu-item]:!h-[42px] [&_.ant-menu-item]:!flex [&_.ant-menu-item]:!items-center [&_.ant-menu-item]:!gap-2 [&_.ant-menu-item]:!px-3 [&_.ant-menu-item]:!m-0 [&_.ant-menu-item]:!rounded-none [&_.ant-menu-item]:!mx-1 [&_.ant-menu-item]:!w-auto
            [&_.ant-menu-item-selected]:!bg-[#f57c00] [&_.ant-menu-item-selected]:!text-white
            [&_.ant-menu-item-selected]:!rounded-sm
            [&_.ant-menu-item-selected>span]:!text-white
            [&_.ant-menu-item:hover]:!bg-white/5
            [&_.ant-menu-item]:!text-white/40
            [&_.ant-menu-item-icon]:!mr-0 [&_.ant-menu-item-icon]:!text-sm"
        />
        <div className="!border-t !border-white/5">
          <Menu
            mode="inline"
            selectedKeys={selectedModule ? [selectedModule] : []}
            onClick={({ key }) => handleMenuClick(key)}
            items={settingsItem ? buildItems([settingsItem]) : []}
            className="!bg-transparent !border-r-0
              [&_.ant-menu-item]:!h-[42px] [&_.ant-menu-item]:!flex [&_.ant-menu-item]:!items-center [&_.ant-menu-item]:!gap-2 [&_.ant-menu-item]:!px-3 [&_.ant-menu-item]:!m-0 [&_.ant-menu-item]:!rounded-none [&_.ant-menu-item]:!mx-1 [&_.ant-menu-item]:!w-auto
              [&_.ant-menu-item-selected]:!bg-[#f57c00] [&_.ant-menu-item-selected]:!text-white
              [&_.ant-menu-item-selected]:!rounded-sm
              [&_.ant-menu-item-selected>span]:!text-white
              [&_.ant-menu-item:hover]:!bg-white/5
              [&_.ant-menu-item]:!text-white/40
              [&_.ant-menu-item-icon]:!mr-0 [&_.ant-menu-item-icon]:!text-sm"
          />
        </div>
      </div>

      {kullanici && (
        <div className="!border-t !border-white/5 !flex-shrink-0">
          <div className="!pt-3 !px-3 !pb-2.5 !flex !items-center !gap-2.5">
            <Avatar
              size={28}
              icon={<UserOutlined />}
              className="!bg-[#f57c00] !flex-shrink-0"
            />
            <div className="!flex-1 !min-w-0">
              <div className="!text-[11px] !text-white/80 !font-medium !truncate !leading-tight">
                {kullanici.ad}
              </div>
              <div className="!text-[9px] !text-white/30 !truncate !leading-tight">
                {kullanici.girisKodu || kullanici.kod}
              </div>
            </div>
            <Dropdown
              menu={{
                items: [
                  { key: 'cikis', icon: <LogoutOutlined />, label: 'Çıkış Yap', onClick: logout },
                ],
              }}
              trigger={['click']}
              placement="topRight"
            >
              <button className="!text-white/30 !hover:text-white/60 !text-xs !p-1 !leading-none !bg-transparent !border-none !cursor-pointer">
                •••
              </button>
            </Dropdown>
          </div>
        </div>
      )}
    </div>
  )
}
