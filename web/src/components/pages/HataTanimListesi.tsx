'use client'

import { Table, Tag, Dropdown, Button, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { hataTanimApi, type HataTanim } from '@/lib/hata-tanim-api'

interface HataTanimRow {
  key: string
  id: number
  hataKodu: string
  hataAdi: string
  ozelKod: string | null
  kullanimda: boolean
}

interface HataTanimListesiProps {
  onSelect?: (kod: string) => void
  onNew?: () => void
}

export default function HataTanimListesi({ onSelect, onNew }: HataTanimListesiProps) {
  const [data, setData] = useState<HataTanimRow[]>([])
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const list = await hataTanimApi.list()
      setData(
        list.map((d: HataTanim) => ({
          key: String(d.id),
          id: d.id,
          hataKodu: d.hataKodu,
          hataAdi: d.hataAdi,
          ozelKod: d.ozelKod,
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

  const columns: ColumnsType<HataTanimRow> = [
    {
      title: 'Hata Kodu',
      dataIndex: 'hataKodu',
      key: 'hataKodu',
      width: 120,
      render: (text) => <span className="!text-[11px] !font-medium !text-[#f57c00]">{text}</span>,
    },
    {
      title: 'Hata Adı',
      dataIndex: 'hataAdi',
      key: 'hataAdi',
      render: (text) => <span className="!text-[11px]">{text}</span>,
    },
    {
      title: 'Özel Kod',
      dataIndex: 'ozelKod',
      key: 'ozelKod',
      width: 120,
      render: (text) => <span className="!text-[11px]">{text ?? '-'}</span>,
    },
    {
      title: 'Durum',
      dataIndex: 'kullanimda',
      key: 'kullanimda',
      width: 90,
      render: (kullanimda: boolean) => (
        <Tag color={kullanimda ? 'green' : 'default'} className="!text-[10px]">
          {kullanimda ? 'Aktif' : 'Pasif'}
        </Tag>
      ),
    },
  ]

  return (
    <Dropdown menu={{ items: contextMenuItems }} trigger={['contextMenu']}>
      <div className="!p-3">
        <div className="!flex !items-center !justify-between !mb-3">
          <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
            Hata Tanımları Listesi
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
              onDoubleClick: () => onSelect?.(record.hataKodu),
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
