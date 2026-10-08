'use client'

import { useState, useEffect } from 'react'
import { Button, Input, InputNumber, Switch, Table, Modal, Form, App, Space, Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { islemApi, type IslemKarti } from '@/lib/islem-api'

export type { IslemKarti }

interface IslemKartlariProps {
  onSelect?: (islem: IslemKarti) => void
  /** Doluysa liste bu tipe kilitlenir (örn. 2 = Proses Tanımları), yeni kayıtlar bu tiple açılır. */
  sabitTip?: number | null
}

export default function IslemKartlari({ onSelect, sabitTip }: IslemKartlariProps) {
  const { message, modal } = App.useApp()
  const [data, setData] = useState<IslemKarti[]>([])
  const [editing, setEditing] = useState<IslemKarti | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  /** Yeni kayıtta kod otomatik verilsin mi (tip bazında 01'den artan). */
  const [otomatikKod, setOtomatikKod] = useState(true)

  /** Bu tipteki sayısal kodların max+1'i (2 haneli, örn. 01 → 02). */
  const sonrakiKod = (tip: number): string => {
    const max = data
      .filter((d) => (d.tip ?? 1) === tip)
      .map((d) => parseInt(d.kod, 10))
      .filter((n) => Number.isFinite(n))
      .reduce((m, n) => Math.max(m, n), 0)
    return String(max + 1).padStart(2, '0')
  }

  const load = async () => {
    setLoading(true)
    try {
      setData(await islemApi.list(sabitTip ?? undefined))
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
      setOtomatikKod(false)
      form.setFieldsValue(rec)
    } else {
      const tip = sabitTip ?? 1
      setOtomatikKod(true)
      form.resetFields()
      form.setFieldsValue({ birim: 'ADET', sira: data.length + 1, aktif: true, varsayilan: false, tip, kod: sonrakiKod(tip) })
    }
    setModalOpen(true)
  }

  const handleSave = () => {
    form.validateFields().then(async (values) => {
      const tip = sabitTip ?? values.tip ?? 1
      const kod = (otomatikKod && !editing ? sonrakiKod(tip) : (values.kod ?? '')).trim().toUpperCase()
      if (!kod) {
        message.warning('Kod gerekli')
        return
      }
      const cakisan = data.find((d) => d.kod.toUpperCase() === kod && (d.tip ?? 1) === tip && (!editing || d.id !== editing.id))
      if (cakisan) {
        message.warning(`Bu kod bu tipte zaten kullanılıyor: ${kod}`)
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
            varsayilan: values.varsayilan ?? false,
            tip,
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
    ...(sabitTip
      ? []
      : [
          {
            title: 'Tip',
            dataIndex: 'tip',
            width: 90,
            render: (v: number) => (v === 2 ? 'Proses' : 'Genel'),
          } as const,
        ]),
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
      title: 'Vars.',
      dataIndex: 'varsayilan',
      width: 60,
      align: 'center',
      render: (v: boolean | undefined, record: IslemKarti) => (
        <Switch
          checked={!!v}
          size="small"
          onChange={async (checked) => {
            try {
              await islemApi.update(record.id, { varsayilan: checked })
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
          {sabitTip === 2 ? 'Proses Tanımları' : 'İşlem Kartları'}
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
        <Form
          form={form}
          layout="vertical"
          className="mt-3"
          onValuesChange={(changed) => {
            // Serbest tip seçiminde tip değişirse otomatik kodu o tipe göre yenile.
            if (!editing && otomatikKod && changed.tip != null) {
              form.setFieldsValue({ kod: sonrakiKod(changed.tip) })
            }
          }}
        >
          {!editing && (
            <Form.Item label="Otomatik Kod" valuePropName="checked">
              <Switch
                checked={otomatikKod}
                onChange={(v) => {
                  setOtomatikKod(v)
                  if (v) {
                    const tip = sabitTip ?? form.getFieldValue('tip') ?? 1
                    form.setFieldsValue({ kod: sonrakiKod(tip) })
                  }
                }}
              />
            </Form.Item>
          )}
          <Form.Item name="kod" label="Kod" rules={[{ required: true, message: 'Kod gerekli' }]}>
            <Input placeholder="Örn: 01" disabled={!editing && otomatikKod} />
          </Form.Item>
          <Form.Item name="ad" label="Ad" rules={[{ required: true, message: 'Ad gerekli' }]}>
            <Input placeholder="Örn: Kesim" />
          </Form.Item>
          {sabitTip ? null : (
            <Form.Item name="tip" label="Tip" initialValue={1}>
              <Select
                options={[
                  { value: 1, label: 'Genel' },
                  { value: 2, label: 'Proses (boyahane)' },
                ]}
              />
            </Form.Item>
          )}
          <Form.Item name="birim" label="Birim">
            <Input placeholder="Örn: ADET (boşsa ADET sayılır)" />
          </Form.Item>
          <Form.Item name="sira" label="Sıra">
            <InputNumber min={1} className="!w-full" />
          </Form.Item>
          <Form.Item name="aktif" label="Aktif" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item
            name="varsayilan"
            label="Varsayılan (202/134'te otomatik seçili gelsin)"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
