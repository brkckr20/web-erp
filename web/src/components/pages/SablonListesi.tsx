'use client'

import { useState } from 'react'
import { Card, Button, Table, Space, Popconfirm, message, Tag } from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'

export interface RaporSablonu {
  id: number
  ad: string
  aciklama: string | null
  tur: string
  pdfBoyut: string
  pdfYon: string
  olusturmaTarihi: string
}

interface Props {
  onYeni: () => void
  onDuzenle: (id: number) => void
}

export default function SablonListesi({ onYeni, onDuzenle }: Props) {
  const [sablonlar] = useState<RaporSablonu[]>([])

  const handleSil = (_id: number) => {
    message.success('Şablon silindi')
  }

  const turTag: Record<string, { color: string; label: string }> = {
    irsaliye: { color: 'blue', label: 'İrsaliye' },
    rapor: { color: 'green', label: 'Rapor' },
    etiket: { color: 'orange', label: 'Etiket' },
  }

  const columns = [
    {
      title: 'Şablon Adı',
      dataIndex: 'ad',
      render: (ad: string) => <span className="!font-medium">{ad}</span>,
    },
    { title: 'Açıklama', dataIndex: 'aciklama', render: (v: string | null) => v || '-' },
    {
      title: 'Tür',
      dataIndex: 'tur',
      render: (tur: string) => {
        const t = turTag[tur]
        return t ? <Tag color={t.color}>{t.label}</Tag> : <Tag>{tur}</Tag>
      },
    },
    {
      title: 'PDF',
      render: (_: unknown, r: RaporSablonu) => `${r.pdfBoyut} / ${r.pdfYon === 'yatay' ? 'Yatay' : 'Dikey'}`,
    },
    {
      title: 'Tarih',
      dataIndex: 'olusturmaTarihi',
      render: (t: string) => new Date(t).toLocaleDateString('tr-TR'),
    },
    {
      title: 'İşlem',
      render: (_: unknown, r: RaporSablonu) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => onDuzenle(r.id)} />
          <Popconfirm title="Silmek istediğinize emin misiniz?" onConfirm={() => handleSil(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="!p-3">
      <div className="!flex !items-center !justify-between !mb-3">
        <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
          Rapor Tasarımı
        </div>
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={onYeni}>
          Yeni Rapor
        </Button>
      </div>
      <Card size="small">
        <Table
          dataSource={sablonlar}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={false}
          locale={{ emptyText: 'Henüz rapor oluşturulmadı' }}
        />
      </Card>
    </div>
  )
}
