'use client'

import { Table, Tag, Dropdown, Button, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { malzemeApi, type Malzeme } from '@/lib/malzeme-api'

interface MalzemeRow {
  key: string
  id: number
  kod: string
  ad: string
  malzemeTuru: string | null
  kullanimda: boolean
}

interface MalzemeListesiProps {
  onSelect?: (kod: string) => void
  onNew?: () => void
}

export default function MalzemeListesi({ onSelect, onNew }: MalzemeListesiProps) {
  const [data, setData] = useState<MalzemeRow[]>([])
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const list = await malzemeApi.list()
      setData(
        list.map((d: Malzeme) => ({
          key: String(d.id),
          id: d.id,
          kod: d.kod,
          ad: d.ad,
          malzemeTuru: d.malzemeTuru,
          kullanimda: d.kullanimda,
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

  const columns: ColumnsType<MalzemeRow> = [
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
      title: 'Türü',
      dataIndex: 'malzemeTuru',
      key: 'malzemeTuru',
      width: 110,
      render: (text) => <span className="!text-[11px]">{text ?? '-'}</span>,
    },
    {
      title: 'Durum',
      dataIndex: 'kullanimda',
      key: 'kullanimda',
      width: 90,
      render: (val: boolean) => (
        <Tag color={val ? 'green' : 'default'} className="!text-[10px]">
          {val ? 'Aktif' : 'Pasif'}
        </Tag>
      ),
    },
  ]

  return (
    <Dropdown menu={{ items: contextMenuItems }} trigger={['contextMenu']}>
      <div className="!p-3">
        <div className="!flex !items-center !justify-between !mb-3">
          <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
            Malzeme Kartları Listesi
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
