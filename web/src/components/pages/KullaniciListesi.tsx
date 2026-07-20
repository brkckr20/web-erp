'use client'

import { Table, Tag, Dropdown, Button, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { kullaniciApi, type Kullanici } from '@/lib/kullanici-api'

interface KullaniciRow {
  key: string
  id: number
  kod: string
  ad: string
  kullaniciTipi: string | null
  durum: boolean
}

interface KullaniciListesiProps {
  onSelect?: (kod: string) => void
  onNew?: () => void
}

export default function KullaniciListesi({ onSelect, onNew }: KullaniciListesiProps) {
  const [data, setData] = useState<KullaniciRow[]>([])
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const list = await kullaniciApi.list()
      setData(
        list.map((d: Kullanici) => ({
          key: String(d.id),
          id: d.id,
          kod: d.kod,
          ad: d.ad,
          kullaniciTipi: d.kullaniciTipi,
          durum: d.durum,
        })),
      )
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const contextMenuItems: MenuProps['items'] = [
    { key: 'yeni', label: 'Yeni', icon: <PlusOutlined />, onClick: () => onNew?.() },
    { key: 'duzenle', label: 'Düzenle', disabled: !selectedRow, onClick: () => selectedRow && onSelect?.(selectedRow) },
    { type: 'divider' },
    { key: 'pasif', label: 'Pasif Yap', disabled: !selectedRow },
  ]

  const columns: ColumnsType<KullaniciRow> = [
    {
      title: 'Kodu',
      dataIndex: 'kod',
      key: 'kod',
      width: 100,
      render: (text) => <span className="!text-[11px] !font-medium !text-[#f57c00]">{text}</span>,
    },
    {
      title: 'Adı',
      dataIndex: 'ad',
      key: 'ad',
      render: (text) => <span className="!text-[11px]">{text}</span>,
    },
    {
      title: 'Tipi',
      dataIndex: 'kullaniciTipi',
      key: 'kullaniciTipi',
      width: 100,
      render: (text) => <span className="!text-[11px]">{text ?? '-'}</span>,
    },
    {
      title: 'Durum',
      dataIndex: 'durum',
      key: 'durum',
      width: 90,
      render: (durum: boolean) => (
        <Tag color={durum ? 'green' : 'default'} className="!text-[10px]">
          {durum ? 'Aktif' : 'Pasif'}
        </Tag>
      ),
    },
  ]

  return (
    <Dropdown menu={{ items: contextMenuItems }} trigger={['contextMenu']}>
      <div className="!p-3">
        <div className="!flex !items-center !justify-between !mb-3">
          <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
            Kullanıcı Tanımları Listesi
          </div>
          <div className="!flex !items-center !gap-1.5">
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={load}
              className="!text-[11px] !h-7"
            />
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={onNew}
              className="!text-[11px] !h-7"
            >
              Yeni
            </Button>
          </div>
        </div>

        <div className="!bg-white !rounded-sm">
          <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={data}
            size="small"
            pagination={false}
            rowSelection={{
              type: 'radio',
              selectedRowKeys: selectedRow ? [selectedRow] : [],
              onChange: (keys) => setSelectedRow(keys[0] as string),
            }}
            onRow={(record) => ({
              onDoubleClick: () => onSelect?.(record.kod),
              className: '!cursor-pointer',
            })}
            className="[&_.ant-table-thead>tr>th]:!text-[10px] [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-[#6b7280] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!bg-[#f9fafb] [&_.ant-table-tbody>tr>td]:!text-[11px] [&_.ant-table-tbody>tr>td]:!py-1.5"
          />
          </Spin>
        </div>
      </div>
    </Dropdown>
  )
}
