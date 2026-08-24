'use client'

import { Table, Tag, Dropdown, Button, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cariHesapApi, type CariHesap } from '@/lib/cari-hesap-api'

const PAGE_SIZE = 50

interface CariRow {
  key: string
  id: number
  kod: string
  ad: string
  cariTipi: string
  durum: boolean
}

interface CariHesapListesiProps {
  onSelect?: (kod: string) => void
  onNew?: () => void
}

export default function CariHesapListesi({ onSelect, onNew }: CariHesapListesiProps) {
  const [data, setData] = useState<CariRow[]>([])
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const pageRef = useRef(1)
  const busyRef = useRef(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const loadPage = useCallback(async (reset = false) => {
    if (busyRef.current) return
    busyRef.current = true
    setLoading(true)
    try {
      const page = reset ? 1 : pageRef.current
      const list = await cariHesapApi.list(undefined, page, PAGE_SIZE)
      const items: CariRow[] = list.map((d: CariHesap) => ({
        key: String(d.id),
        id: d.id,
        kod: d.kod,
        ad: d.ad,
        cariTipi: d.cariHesapTipi ?? '-',
        durum: d.kullanimda,
      }))
      setData(prev => {
        if (reset) return items
        const seen = new Set(prev.map(p => p.id))
        return [...prev, ...items.filter(i => !seen.has(i.id))]
      })
      pageRef.current = page + 1
      setHasMore(list.length >= PAGE_SIZE)
    } catch {
      if (reset) setData([])
    } finally {
      busyRef.current = false
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPage(true)
  }, [loadPage])

  useEffect(() => {
    const container = scrollRef.current
    const el = sentinelRef.current
    if (!container || !el || !hasMore) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) loadPage()
      },
      { root: container, rootMargin: '150px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loadPage])

  const contextMenuItems: MenuProps['items'] = [
    { key: 'yeni', label: 'Yeni', icon: <PlusOutlined />, onClick: () => onNew?.() },
    { key: 'duzenle', label: 'Düzenle', disabled: !selectedRow, onClick: () => selectedRow && onSelect?.(selectedRow) },
    { type: 'divider' },
    { key: 'pasif', label: 'Pasif Yap', disabled: !selectedRow },
  ]

  const columns: ColumnsType<CariRow> = [
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
      title: 'Cari Tipi',
      dataIndex: 'cariTipi',
      key: 'cariTipi',
      width: 150,
      render: (text) => <span className="!text-[11px]">{text}</span>,
    },
    {
      title: 'Durum',
      dataIndex: 'durum',
      key: 'durum',
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
            Cari Hesap Kartları Listesi
          </div>
          <div className="!flex !items-center !gap-1.5">
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => loadPage(true)}
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

        <div
          ref={scrollRef}
          className="!bg-white !rounded-sm !max-h-[calc(100vh-120px)] !overflow-y-auto ![scrollbar-gutter:stable]"
        >
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
            className="[&_.ant-table-thead>tr>th]:!sticky [&_.ant-table-thead>tr>th]:!top-0 [&_.ant-table-thead>tr>th]:!z-10 [&_.ant-table-thead>tr>th]:!text-[10px] [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-[#6b7280] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!bg-[#f9fafb] [&_.ant-table-tbody>tr>td]:!text-[11px] [&_.ant-table-tbody>tr>td]:!py-1.5"
          />
          <div
            ref={sentinelRef}
            className="!h-8 !w-full !flex !items-center !justify-center !text-[#6b7280] !text-[11px]"
          >
            {loading ? <Spin size="small" /> : hasMore ? '' : 'Tüm kayıtlar yüklendi'}
          </div>
        </div>
      </div>
    </Dropdown>
  )
}