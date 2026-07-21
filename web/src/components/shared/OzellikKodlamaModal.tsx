'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input, Modal, Table, Button, App } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { ozellikKodlamaApi, type OzellikKodlama } from '@/lib/ozellik-kodlama-api'

interface OzellikKodlamaModalProps {
  open: boolean
  kategori: string
  value?: number | null
  onChange?: (id: number | null, record?: OzellikKodlama) => void
  onClose?: () => void
}

export default function OzellikKodlamaModal({
  open,
  kategori,
  value,
  onChange,
  onClose,
}: OzellikKodlamaModalProps) {
  const { message } = App.useApp()
  const [data, setData] = useState<OzellikKodlama[]>([])
  const [loading, setLoading] = useState(false)
  const [newAd, setNewAd] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await ozellikKodlamaApi.list(kategori)
      setData(result)
    } catch {
      message.error('Veriler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [kategori])

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, loadData])

  const handleAdd = async () => {
    const trimmed = newAd.trim()
    if (!trimmed) {
      message.warning('Ad alanı zorunludur')
      return
    }
    try {
      const created = await ozellikKodlamaApi.create({ ad: trimmed, kategori })
      setData((prev) => [...prev, created])
      setNewAd('')
      message.success('Eklendi')
    } catch {
      message.error('Eklenemedi')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await ozellikKodlamaApi.delete(id)
      setData((prev) => prev.filter((item) => item.id !== id))
      if (value === id) {
        onChange?.(null)
      }
      message.success('Silindi')
    } catch {
      message.error('Silinemedi')
    }
  }

  const handleSelect = (record: OzellikKodlama) => {
    onChange?.(record.id, record)
    onClose?.()
  }

  const columns: ColumnsType<OzellikKodlama> = [
    {
      title: 'Ad',
      dataIndex: 'ad',
      key: 'ad',
      render: (text) => <span className="!text-[11px]">{text}</span>,
    },
    {
      title: '',
      key: 'actions',
      width: 40,
      render: (_, record) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined style={{ fontSize: 12 }} />}
          onClick={(e) => {
            e.stopPropagation()
            handleDelete(record.id)
          }}
        />
      ),
    },
  ]

  return (
    <Modal
      title={`${kategori} Özellik Kodlama`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={400}
    >
      <div className="!flex !gap-2 !mb-3">
        <Input
          size="small"
          placeholder="Ad"
          value={newAd}
          onChange={(e) => setNewAd(e.target.value)}
          onPressEnter={handleAdd}
          className="!flex-1 !text-[11px]"
        />
        <Button
          size="small"
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          className="!text-[11px] !h-7"
        >
          Ekle
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        size="small"
        pagination={false}
        loading={loading}
        onRow={(record) => ({
          onDoubleClick: () => handleSelect(record),
          className: `!cursor-pointer ${record.id === value ? '!bg-blue-50' : ''}`,
        })}
        className="[&_.ant-table-thead>tr>th]:!text-[10px] [&_.ant-table-thead>tr>th]:!text-[#6b7280] [&_.ant-table-tbody>tr>td]:!text-[11px] [&_.ant-table-tbody>tr>td]:!py-1.5"
      />
    </Modal>
  )
}
