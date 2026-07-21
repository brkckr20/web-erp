'use client'

import { Table, Tag, Dropdown, Button, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { malzemeApi, type Malzeme } from '@/lib/malzeme-api'

interface KumasRow {
  key: string
  id: number
  kod: string
  ad: string
  kullanimda: boolean
  cinsi: string | null
  grm2: number | null
}

interface KumasListesiProps {
  onSelect?: (kod: string) => void
  onNew?: () => void
}

export default function KumasListesi({ onSelect, onNew }: KumasListesiProps) {
  const [data, setData] = useState<KumasRow[]>([])
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const list = await malzemeApi.list(2)
      setData(
        list.map((d: Malzeme) => ({
          key: String(d.id),
          id: d.id,
          kod: d.kod,
          ad: d.ad,
          kullanimda: d.kullanimda,
          cinsi: d.cinsi,
          grm2: d.grm2,
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
  ]

  const columns: ColumnsType<KumasRow> = [
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
      title: 'Cinsi',
      dataIndex: 'cinsi',
      key: 'cinsi',
      width: 120,
      render: (text) => <span className="!text-[11px]">{text ?? '-'}</span>,
    },
    {
      title: 'Gr/m²',
      dataIndex: 'grm2',
      key: 'grm2',
      width: 90,
      render: (val: number | null) => <span className="!text-[11px]">{val != null ? val : '-'}</span>,
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
            Kumaş Kartları Listesi
          </div>
          <div className="!flex !items-center !gap-1.5">
            <Button size="small" icon={<ReloadOutlined />} onClick={load} className="!text-[11px] !h-7" />
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
