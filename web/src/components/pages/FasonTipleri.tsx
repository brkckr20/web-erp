'use client'

import {
  Input,
  Button,
  Table,
  Tag,
  Switch,
  Spin,
  Modal,
  App,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons'
import { useState, useEffect, useRef } from 'react'
import {
  fasonTipiApi,
  parseKategoriler,
  FASON_KATEGORILER,
  type FasonTipi,
} from '@/lib/fason-tipi-api'

interface Row {
  key: string
  id: number
  ad: string
  kategoriler?: string | null
  kullanimda: boolean
}

export default function FasonTipleri() {
  const { message, modal } = App.useApp()
  const [data, setData] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)

  const [modalVisible, setModalVisible] = useState(false)
  const [currentRow, setCurrentRow] = useState<Row | null>(null)
  const [yeniAd, setYeniAd] = useState('')
  const [yeniKategoriler, setYeniKategoriler] = useState<string[]>([])

  const load = async () => {
    setLoading(true)
    try {
      const list = await fasonTipiApi.list()
      setData(
        list.map((d: FasonTipi) => ({
          key: String(d.id),
          id: d.id,
          ad: d.ad,
          kategoriler: d.kategoriler,
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
      setYeniKategoriler(parseKategoriler(row.kategoriler))
    } else {
      setCurrentRow(null)
      setYeniAd('')
      setYeniKategoriler(['kumas'])
    }
  }

  const closeModal = () => {
    setModalVisible(false)
    setCurrentRow(null)
    setYeniAd('')
    setYeniKategoriler([])
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
        await fasonTipiApi.update(currentRow.id, {
          ad,
          kategoriler: yeniKategoriler.join(';'),
          kullanimda: currentRow.kullanimda,
        })
        message.success('Fason tanımı güncellendi')
      } else {
        await fasonTipiApi.create({
          ad,
          kategoriler: yeniKategoriler.join(';'),
          kullanimda: true,
        })
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
      title: 'Kategoriler',
      dataIndex: 'kategoriler',
      key: 'kategoriler',
      width: 160,
      render: (val?: string | null) =>
        parseKategoriler(val).length === 0 ? (
          <span className="!text-[10px] !text-gray-400">-</span>
        ) : (
          <span className="!flex !gap-1">
            {FASON_KATEGORILER.filter((k) => parseKategoriler(val).includes(k.key)).map((k) => (
              <Tag
                key={k.key}
                color={k.key === 'kumas' ? 'blue' : k.key === 'iplik' ? 'purple' : 'default'}
                className="!text-[10px] !mr-0"
              >
                {k.label}
              </Tag>
            ))}
          </span>
        ),
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
        open={modalVisible}
        onCancel={closeModal}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={closeModal}>İptal</Button>
            <Button type="primary" onClick={handleKaydet}>
              {currentRow ? 'Güncelle' : 'Kaydet'}
            </Button>
          </div>
        }
      >
        <Input
          value={yeniAd}
          onChange={(e) => setYeniAd(e.target.value)}
          onPressEnter={() => handleKaydet()}
          placeholder="Fason tanımı"
        />
        <div className="!flex !items-center !gap-4 !mt-3">
          <span className="!text-[12px] !text-gray-500">Kategoriler:</span>
          {FASON_KATEGORILER.map((k) => (
            <label
              key={k.key}
              className="!flex !items-center !gap-1.5 !text-[12px] !cursor-pointer"
            >
              <Switch
                size="small"
                checked={yeniKategoriler.includes(k.key)}
                onChange={(v) =>
                  setYeniKategoriler(
                    v
                      ? [...yeniKategoriler, k.key]
                      : yeniKategoriler.filter((x) => x !== k.key),
                  )
                }
              />
              {k.label}
            </label>
          ))}
        </div>
      </Modal>
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