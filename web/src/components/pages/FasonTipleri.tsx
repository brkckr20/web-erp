'use client'

import {
  Input,
  Button,
  Table,
  Tag,
  Spin,
  Modal,
  App,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons'
import { useState, useEffect, useRef } from 'react'
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

  const [modalVisible, setModalVisible] = useState(false)
  const [currentRow, setCurrentRow] = useState<Row | null>(null)
  const [yeniAd, setYeniAd] = useState('')

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

  const openModal = (row?: Row) => {
    setModalVisible(true)
    if (row) {
      setCurrentRow(row)
      setYeniAd(row.ad)
    } else {
      setCurrentRow(null)
      setYeniAd('')
    }
  }

  const closeModal = () => {
    setModalVisible(false)
    setCurrentRow(null)
    setYeniAd('')
  }

  const handleKaydet = async () => {
    const ad = yeniAd.trim()
    if (!ad) {
      message.warning('Fason tanımı giriniz')
      return
    }
    setLoading(true)
    try {
      if (currentRow?.id) {
        await fasonTipiApi.update(currentRow.id, { ad, kullanimda: currentRow.kullanimda })
        message.success('Fason tanımı güncellendi')
      } else {
        await fasonTipiApi.create({ ad, kullanimda: true })
        message.success('Fason tanımı eklendi')
      }
      await load()
      closeModal()
    } catch (err: unknown) {
      message.error('Hata: ' + ((err as Error)?.message ?? String(err)))
    } finally {
      setLoading(false)
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

  const lastClick = useRef<number>(0)
  const handleRowClick = (id: number) => {
    const now = Date.now()
    if (now - lastClick.current < 300) {
      const row = data.find((r) => r.id === id)
      if (row) openModal(row)
      lastClick.current = 0
    } else {
      lastClick.current = now
    }
  }

  const columns: ColumnsType<Row> = [
    {
      title: 'Ad',
      dataIndex: 'ad',
      key: 'ad',
      render: (text) => {
        const row = data.find((r) => r.ad === text);
        return (
          <span
            className="!text-[11px] !font-medium !text-[#f57c00]"
            onDoubleClick={() => row && openModal(row)}
          >
            {text}
          </span>
        );
      },
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
      <Modal
        title={currentRow ? 'Fason Tanımını Düzenle' : 'Yeni Fason Tanımı Ekle'}
        visible={modalVisible}
        onCancel={closeModal}
        footer={() => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
    <button onClick={closeModal} style={{ marginRight: 8 }}>İptal</button>
    <Button type="primary" onClick={handleKaydet}>
      {currentRow ? 'Güncelle' : 'Kaydet'}
    </Button>
  </div>
)}
      />
      <div className="!flex !items-center !gap-2 !mb-3 !flex-shrink-0">
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => openModal(undefined)}
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
            onRow={(record) => ({
              onClick: (e) => handleRowClick(record.id),
            })}
            className="[&_.ant-table-thead>tr>th>:!text-[10px] [&_.ant-table-thead>tr>th>:!font-semibold] [&_.ant-table-thead>tr>th>:!text-[#6b7280] [&_.ant-table-thead>tr>th>:!uppercase] [&_.ant-table-thead>tr>th>:!bg-[#f9fafb]] [&_.ant-table-tbody>tr>td>:!text-[11px] [&_.ant-table-tbody>tr>td>:!py-1.5]"
          />
        </Spin>
      </div>
    </div>
  )
}