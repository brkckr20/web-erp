'use client'

import { Table, Tag, Dropdown, Button, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { isEmriApi, type IsEmri } from '@/lib/is-emri-api'

interface IsEmriRow {
  key: string
  id: number
  isEmriNo: string
  siparisNo: string | null
  durum: string | null
}

interface IsEmriListesiProps {
  onSelect?: (kod: string) => void
  onNew?: () => void
}

export default function IsEmriListesi({ onSelect, onNew }: IsEmriListesiProps) {
  const [data, setData] = useState<IsEmriRow[]>([])
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const list = await isEmriApi.list()
      setData(
        list.map((d: IsEmri) => ({
          key: String(d.id),
          id: d.id,
          isEmriNo: d.isEmriNo,
          siparisNo: d.siparisNo,
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

  const columns: ColumnsType<IsEmriRow> = [
    {
      title: 'İş Emri No',
      dataIndex: 'isEmriNo',
      key: 'isEmriNo',
      width: 140,
      render: (text) => <span className="!text-[11px] !font-medium !text-[#f57c00]">{text}</span>,
    },
    {
      title: 'Sipariş No',
      dataIndex: 'siparisNo',
      key: 'siparisNo',
      width: 140,
      render: (text) => <span className="!text-[11px]">{text ?? '-'}</span>,
    },
    {
      title: 'Durum',
      dataIndex: 'durum',
      key: 'durum',
      width: 100,
      render: (text) => <Tag color={text ? 'blue' : 'default'} className="!text-[10px]">{text ?? '-'}</Tag>,
    },
  ]

  return (
    <Dropdown menu={{ items: contextMenuItems }} trigger={['contextMenu']}>
      <div className="!p-3">
        <div className="!flex !items-center !justify-between !mb-3">
          <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
            İş Emri Tanımları Listesi
          </div>
          <div className="!flex !items-center !gap-1.5">
            <Button size="small" icon={<ReloadOutlined />} onClick={load} className="!text-[11px] !h-7" />
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={onNew} className="!text-[11px] !h-7">
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
                onDoubleClick: () => onSelect?.(record.isEmriNo),
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
