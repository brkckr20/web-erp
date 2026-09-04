'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Upload, Table, Space, Popconfirm, message, Tag } from 'antd'
import { UploadOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { logoApi, Logo } from '@/lib/logo-api'

export default function LogoYonetimi() {
  const [logolar, setLogolar] = useState<Logo[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [ad, setAd] = useState('')
  const [dosya, setDosya] = useState<File | null>(null)
  const [yukleniyor2, setYukleniyor2] = useState(false)

  const logolariGetir = async () => {
    setYukleniyor(true)
    try {
      const res = await logoApi.list()
      setLogolar(res)
    } catch {
      message.error('Logolar yüklenemedi')
    } finally {
      setYukleniyor(false)
    }
  }

  useEffect(() => {
    logolariGetir()
  }, [])

  const handleYukle = async () => {
    if (!ad.trim()) { message.warning('Logo adı gerekli'); return }
    if (!dosya) { message.warning('Dosya seçin'); return }
    setYukleniyor2(true)
    try {
      await logoApi.upload(ad.trim(), dosya)
      message.success('Logo yüklendi')
      setAd('')
      setDosya(null)
      logolariGetir()
    } catch {
      message.error('Yükleme başarısız')
    } finally {
      setYukleniyor2(false)
    }
  }

  const handleSil = async (id: number) => {
    try {
      await logoApi.remove(id)
      message.success('Logo silindi')
      logolariGetir()
    } catch {
      message.error('Silme başarısız')
    }
  }

  const columns = [
    {
      title: 'Önizleme',
      dataIndex: 'ad',
      render: (ad: string) => (
        <img src={logoApi.getDosyaUrl(ad)} alt={ad} style={{ height: 40, objectFit: 'contain' }} />
      ),
    },
    { title: 'Ad', dataIndex: 'ad' },
    {
      title: 'Boyut',
      dataIndex: 'boyut',
      render: (b: number) => `${(b / 1024).toFixed(1)} KB`,
    },
    { title: 'Mimetype', dataIndex: 'mimetype' },
    {
      title: 'Tarih',
      dataIndex: 'createdAt',
      render: (t: string) => new Date(t).toLocaleDateString('tr-TR'),
    },
    {
      title: 'İşlem',
      render: (_: unknown, r: Logo) => (
        <Popconfirm title="Silmek istediğinize emin misiniz?" onConfirm={() => handleSil(r.id)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ]

  return (
    <div className="!p-3">
      <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider !mb-3">
        Logo Yönetimi
      </div>
      <Card size="small" className="!mb-3">
        <Space direction="vertical" className="!w-full">
          <Space>
            <input
              className="!border !rounded !px-2 !py-1 !text-xs"
              placeholder="Logo adı (ör: firma-logosu)"
              value={ad}
              onChange={(e) => setAd(e.target.value)}
            />
            <Upload
              beforeUpload={(file) => { setDosya(file); return false }}
              showUploadList={false}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />} size="small">Dosya Seç</Button>
            </Upload>
            {dosya && <Tag>{dosya.name}</Tag>}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="small"
              loading={yukleniyor2}
              onClick={handleYukle}
            >
              Yükle
            </Button>
          </Space>
        </Space>
      </Card>
      <Card size="small" title={`${logolar.length} Logo`}>
        <Table
          dataSource={logolar}
          columns={columns}
          rowKey="id"
          loading={yukleniyor}
          size="small"
          pagination={false}
        />
      </Card>
    </div>
  )
}
