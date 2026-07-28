'use client'

import { Table, Tag, Dropdown, Button, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { aksesuarTipiApi, type AksesuarTipi } from '@/lib/aksesuar-tipi-api'

interface Row {
  key: string
  id: number
  ad: string
  onEk: string
  kullanimda: boolean
}

interface AksesuarTipiListesiProps {
  onSelect?: (id: number) => void
  onNew?: () => void
}

export default function AksesuarTipiListesi({ onSelect, onNew }: AksesuarTipiListesiProps) {
  const [data, setData] = useState<Row[]>([])
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const list = await aksesuarTipiApi.list()
      setData(
        list.map((d: AksesuarTipi) => ({
          key: String(d.id),
          id: d.id,
          ad: d.ad,
          onEk: d.onEk ?? '',
          kullanimda: d.kullanimda,
        })),
      )
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const contextMenuItems: MenuProps['items'] = [
    { key: 'yeni', label: 'Yeni', icon: <PlusOutlined />, onClick: () => onNew?.() },
    { key: 'duzenle', label: 'Düzenle', disabled: !selectedRow, onClick: () => selectedRow && onSelect?.(selectedRow) },
    { type: 'divider' },
  ]

  const columns: ColumnsType<Row> = [
    {
      title: 'Ad',
      dataIndex: 'ad',
      key: 'ad',
      render: (text) => <span className="!text-[11px] !font-medium !text-[#f57c00]">{text}</span>,
    },
    {
      title: 'Ön Ek',
      dataIndex: 'onEk',
      key: 'onEk',
      width: 120,
      render: (text) => <span className="!text-[11px]">{text || '-'}</span>,
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
      <div className="!p-3 !h-full !flex !flex-col">
        <div className="!flex !items-center !justify-between !mb-3 !shrink-0">
          <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
            Aksesuar Tipi Listesi
          </div>
          <div className="!flex !items-center !gap-1.5">
            <Button size="small" icon={<ReloadOutlined />} onClick={load} className="!text-[11px] !h-7" />
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={onNew} className="!text-[11px] !h-7">
              Yeni
            </Button>
          </div>
        </div>
        <div className="!bg-white !rounded-sm !flex-1 !overflow-y-auto">
          <Spin spinning={loading}>
            <Table
              columns={columns}
              dataSource={data}
              size="small"
              pagination={false}
              rowSelection={{
                type: 'radio',
                selectedRowKeys: selectedRow ? [String(selectedRow)] : [],
                onChange: (keys) => setSelectedRow(Number(keys[0])),
              }}
              onRow={(record) => ({
                onDoubleClick: () => onSelect?.(record.id),
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