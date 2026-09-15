'use client'

import { useState, useEffect } from 'react'
import { Button, Input, InputNumber, Switch, Table, Modal, Form, App, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { islemApi, type IslemKarti } from '@/lib/islem-api'

export type { IslemKarti }

interface IslemKartlariProps {
  onSelect?: (islem: IslemKarti) => void
}

export default function IslemKartlari({ onSelect }: IslemKartlariProps) {
  const { message, modal } = App.useApp()
  const [data, setData] = useState<IslemKarti[]>([])
  const [editing, setEditing] = useState<IslemKarti | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const load = async () => {
    setLoading(true)
    try {
      setData(await islemApi.list())
    } catch {
      message.error('İşlemler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openEditor = (rec: IslemKarti | null) => {
    setEditing(rec)
    if (rec) {
      form.setFieldsValue(rec)
    } else {
      form.resetFields()
      form.setFieldsValue({ birim: 'ADET', sira: data.length + 1, aktif: true })
    }
    setModalOpen(true)
  }

  const handleSave = () => {
    form.validateFields().then(async (values) => {
      const kod = (values.kod ?? '').trim().toUpperCase()
      if (!kod) {
        message.warning('Kod gerekli')
        return
      }
      const cakisan = data.find((d) => d.kod.toUpperCase() === kod && (!editing || d.id !== editing.id))
      if (cakisan) {
        message.warning(`Bu kod zaten kullanılıyor: ${kod}`)
        return
      }
      try {
        if (editing) {
          await islemApi.update(editing.id, {
            ...values,
            kod,
            birim: (values.birim ?? '').trim() || 'ADET',
          })
          message.success('İşlem kartı güncellendi')
        } else {
          await islemApi.create({
            kod,
            ad: (values.ad ?? '').trim(),
            birim: (values.birim ?? '').trim() || 'ADET',
            sira: values.sira ?? data.length + 1,
            aktif: values.aktif ?? true,
          })
          message.success('İşlem kartı eklendi')
        }
        await load()
        setModalOpen(false)
        setEditing(null)
        form.resetFields()
      } catch (e: any) {
        message.error(e?.message || 'Kayıt sırasında hata oluştu')
      }
    })
  }

  const handleDelete = (id: number) => {
    modal.confirm({
      title: 'Silmek istediğinize emin misiniz?',
      onOk: async () => {
        try {
          await islemApi.remove(id)
          await load()
          message.success('İşlem kartı silindi')
        } catch (e: any) {
          message.error(e?.message || 'Silme sırasında hata oluştu')
        }
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
      render: (v: boolean, record: IslemKarti) => (
        <Switch
          checked={v}
          size="small"
          onChange={async (checked) => {
            try {
              await islemApi.update(record.id, { aktif: checked })
              await load()
            } catch (e: any) {
              message.error(e?.message || 'Güncelleme sırasında hata oluştu')
            }
          }}
        />
      ),
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
            onClick={() => openEditor(record)}
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
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => openEditor(null)}
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
        loading={loading}
        onRow={(record) => ({
          onDoubleClick: () => openEditor(record),
        })}
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
          <Form.Item name="birim" label="Birim">
            <Input placeholder="Örn: ADET (boşsa ADET sayılır)" />
          </Form.Item>
          <Form.Item name="sira" label="Sıra">
            <InputNumber min={1} className="!w-full" />
          </Form.Item>
          <Form.Item name="aktif" label="Aktif" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
