'use client'

import { useState } from 'react'
import { Button, Input, InputNumber, Switch, Table, Modal, Form, App, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'

export interface IslemKarti {
  id: number
  kod: string
  ad: string
  birim: string
  sira: number
  aktif: boolean
}

const defaultIslemler: IslemKarti[] = [
  { id: 1, kod: 'KESIM', ad: 'Kesim', birim: 'ADET', sira: 1, aktif: true },
  { id: 2, kod: 'DIKIM', ad: 'Dikim', birim: 'ADET', sira: 2, aktif: true },
  { id: 3, kod: 'PAKET', ad: 'Paket', birim: 'ADET', sira: 3, aktif: true },
  { id: 4, kod: 'UTU', ad: 'Ütüleme', birim: 'ADET', sira: 4, aktif: true },
  { id: 5, kod: 'KALITE', ad: 'Kalite Kontrol', birim: 'ADET', sira: 5, aktif: true },
]

interface IslemKartlariProps {
  onSelect?: (islem: IslemKarti) => void
}

export default function IslemKartlari({ onSelect }: IslemKartlariProps) {
  const { message, modal } = App.useApp()
  const [data, setData] = useState<IslemKarti[]>(defaultIslemler)
  const [editing, setEditing] = useState<IslemKarti | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const handleSave = () => {
    form.validateFields().then((values) => {
      if (editing) {
        setData((prev) =>
          prev.map((d) => (d.id === editing.id ? { ...d, ...values } : d)),
        )
        message.success('İşlem kartı güncellendi')
      } else {
        const yeni: IslemKarti = {
          id: Date.now(),
          ...values,
          sira: data.length + 1,
          aktif: true,
        }
        setData((prev) => [...prev, yeni])
        message.success('İşlem kartı eklendi')
      }
      setModalOpen(false)
      setEditing(null)
      form.resetFields()
    })
  }

  const handleDelete = (id: number) => {
    modal.confirm({
      title: 'Silmek istediğinize emin misiniz?',
      onOk: () => {
        setData((prev) => prev.filter((d) => d.id !== id))
        message.success('İşlem kartı silindi')
      },
    })
  }

  const columns: ColumnsType<IslemKarti> = [
    {
      title: 'Sıra',
      dataIndex: 'sira',
      width: 60,
      align: 'center',
    },
    {
      title: 'Kod',
      dataIndex: 'kod',
      width: 120,
    },
    {
      title: 'Ad',
      dataIndex: 'ad',
    },
    {
      title: 'Birim',
      dataIndex: 'birim',
      width: 80,
    },
    {
      title: 'Aktif',
      dataIndex: 'aktif',
      width: 70,
      align: 'center',
      render: (v: boolean) => <Switch checked={v} size="small" disabled />,
    },
    {
      title: '',
      width: 70,
      align: 'center',
      render: (_: unknown, record: IslemKarti) => (
        <Space size={0}>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditing(record)
              form.setFieldsValue(record)
              setModalOpen(true)
            }}
          />
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ]

  return (
    <div className="!p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider">
          İşlem Kartları
        </div>
        <Button
          size="small"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null)
            form.resetFields()
            setModalOpen(true)
          }}
        >
          Yeni İşlem
        </Button>
      </div>

      <Table<IslemKarti>
        size="small"
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={false}
      />

      <Modal
        open={modalOpen}
        title={editing ? 'İşlem Kartı Düzenle' : 'Yeni İşlem Kartı'}
        onCancel={() => {
          setModalOpen(false)
          setEditing(null)
          form.resetFields()
        }}
        onOk={handleSave}
        width={400}
      >
        <Form form={form} layout="vertical" className="mt-3">
          <Form.Item name="kod" label="Kod" rules={[{ required: true, message: 'Kod gerekli' }]}>
            <Input placeholder="Örn: KESIM" />
          </Form.Item>
          <Form.Item name="ad" label="Ad" rules={[{ required: true, message: 'Ad gerekli' }]}>
            <Input placeholder="Örn: Kesim" />
          </Form.Item>
          <Form.Item name="birim" label="Birim" rules={[{ required: true, message: 'Birim gerekli' }]}>
            <Input placeholder="Örn: ADET" />
          </Form.Item>
          <Form.Item name="sira" label="Sıra">
            <InputNumber min={1} className="!w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
