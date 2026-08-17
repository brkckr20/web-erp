'use client'

import { Input, Button, Table, Tag, Spin, App } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { fasonTipiApi, type FasonTipi } from '@/lib/fason-tipi-api'

interface Row {
  key: string
  id: number
  ad: string
  kullanimda: boolean
}

export default function FasonTipleri() {
  const { message, modal } = App.useApp()
  const [data, setData] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [yeniAd, setYeniAd] = useState('')
  const [ekliyor, setEkliyor] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const list = await fasonTipiApi.list()
      setData(
        list.map((d: FasonTipi) => ({
          key: String(d.id),
          id: d.id,
          ad: d.ad,
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

  const handleEkle = async () => {
    const ad = yeniAd.trim()
    if (!ad) {
      message.warning('Fason tanımı giriniz')
      return
    }
    setEkliyor(true)
    try {
      await fasonTipiApi.create({ ad, kullanimda: true })
      message.success('Fason tanımı eklendi')
      setYeniAd('')
      await load()
    } catch (err: unknown) {
      message.error('Eklenirken hata: ' + ((err as Error)?.message ?? String(err)))
    } finally {
      setEkliyor(false)
    }
  }

  const handleSil = (row: Row) => {
    modal.confirm({
      title: 'Fason Tipi Sil',
      content: `"${row.ad}" tanımını silmek istediğinize emin misiniz?`,
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await fasonTipiApi.delete(row.id)
          message.success('Fason tipi silindi')
          await load()
        } catch (err: unknown) {
          message.error('Silinirken hata: ' + ((err as Error)?.message ?? String(err)))
        }
      },
    })
  }

  const columns: ColumnsType<Row> = [
    {
      title: 'Ad',
      dataIndex: 'ad',
      key: 'ad',
      render: (text) => <span className="!text-[11px] !font-medium !text-[#f57c00]">{text}</span>,
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
    {
      title: 'İşlem',
      key: 'islem',
      width: 70,
      align: 'center',
      render: (_, row) => (
        <Button
          type="text"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleSil(row)}
          className="!text-[12px]"
        />
      ),
    },
  ]

  return (
    <div className="!p-3 !h-full !flex !flex-col">
      <div className="!flex !items-center !gap-2 !mb-3 !flex-shrink-0">
        <Input
          size="small"
          placeholder="Fason tanımı girin..."
          value={yeniAd}
          onChange={(e) => setYeniAd(e.target.value)}
          onPressEnter={handleEkle}
          className="!w-64 !text-[12px]"
        />
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={handleEkle}
          loading={ekliyor}
          disabled={!yeniAd.trim()}
          className="!text-[12px] !h-7"
        >
          Yeni Fason Tanımı Ekle
        </Button>
        <Button size="small" icon={<ReloadOutlined />} onClick={load} className="!text-[12px] !h-7" />
      </div>
      <div className="!bg-white !rounded-sm !flex-1 !overflow-y-auto">
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={data}
            size="small"
            pagination={false}
            locale={{ emptyText: 'Henüz fason tanımı yok' }}
            className="[&_.ant-table-thead>tr>th]:!text-[10px] [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-[#6b7280] [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!bg-[#f9fafb] [&_.ant-table-tbody>tr>td]:!text-[11px] [&_.ant-table-tbody>tr>td]:!py-1.5"
          />
        </Spin>
      </div>
    </div>
  )
}
