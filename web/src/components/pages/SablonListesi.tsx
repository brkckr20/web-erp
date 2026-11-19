'use client'

import { useEffect, useState } from 'react'
import { Card, Button, Table, Space, Popconfirm, App, Tag, Input, Modal } from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, ReloadOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { sablonApi, type Sablon } from '@/lib/sablon-api'

interface Props {
  onYeni: () => void
  onDuzenle: (id: number) => void
}

export default function SablonListesi({ onYeni, onDuzenle }: Props) {
  const { message } = App.useApp()
  const [sablonlar, setSablonlar] = useState<Sablon[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [arama, setArama] = useState('')
  const [kopyalanan, setKopyalanan] = useState<Sablon | null>(null)
  const [kopyaAd, setKopyaAd] = useState('')
  const [kopyalaniyor, setKopyalaniyor] = useState(false)

  const yukle = async () => {
    setYukleniyor(true)
    try {
      const data = await sablonApi.list()
      setSablonlar(data)
    } catch {
      message.error('Şablonlar yüklenemedi')
    } finally {
      setYukleniyor(false)
    }
  }

  useEffect(() => { yukle() }, [])

  const filtrelenmis = sablonlar.filter(s =>
    s.ad.toLowerCase().includes(arama.toLowerCase()) ||
    s.ekranAdi.toLowerCase().includes(arama.toLowerCase())
  )

  const handleSil = async (id: number) => {
    try {
      await sablonApi.remove(id)
      message.success('Şablon silindi')
      yukle()
    } catch {
      message.error('Silinemedi')
    }
  }

  const kopyalaAc = (r: Sablon) => {
    setKopyalanan(r)
    setKopyaAd(`${r.ad} (Kopya)`)
  }

  const handleKopyala = async () => {
    if (!kopyalanan) return
    const ad = kopyaAd.trim()
    if (!ad) {
      message.warning('Rapor şablon adı gerekli')
      return
    }
    const ayniAdVar = sablonlar.some(
      (s) => s.ekranAdi === kopyalanan.ekranAdi && s.ad.toLocaleLowerCase('tr') === ad.toLocaleLowerCase('tr'),
    )
    if (ayniAdVar) {
      message.warning('Bu ekranda aynı adla bir şablon zaten var')
      return
    }
    setKopyalaniyor(true)
    try {
      await sablonApi.create({
        ad,
        ekranAdi: kopyalanan.ekranAdi,
        htmlIcerik: kopyalanan.htmlIcerik,
        sayfaEn: kopyalanan.sayfaEn,
        sayfaBoy: kopyalanan.sayfaBoy,
        yon: kopyalanan.yon,
        ustBosluk: kopyalanan.ustBosluk,
        altBosluk: kopyalanan.altBosluk,
        solBosluk: kopyalanan.solBosluk,
        sagBosluk: kopyalanan.sagBosluk,
        altBilgi: kopyalanan.altBilgi,
        aktif: kopyalanan.aktif,
        barkodOneki: kopyalanan.barkodOneki,
        filigranMetin: kopyalanan.filigranMetin,
        filigranKosul: kopyalanan.filigranKosul,
        sorgular: kopyalanan.sorgular.map((s) => ({ ad: s.ad, sqlIcerik: s.sqlIcerik, sira: s.sira })),
      })
      message.success('Şablon kopyalandı')
      setKopyalanan(null)
      yukle()
    } catch {
      message.error('Kopyalanamadı')
    } finally {
      setKopyalaniyor(false)
    }
  }

  const ekranEtiket: Record<string, { color: string; label: string }> = {
    irsaliye: { color: 'blue', label: 'İrsaliye' },
    siparis: { color: 'green', label: 'Sipariş' },
    etiket: { color: 'orange', label: 'Etiket' },
    toner: { color: 'purple', label: 'Toner' },
  }

  const columns = [
    {
      title: 'Şablon Adı',
      dataIndex: 'ad',
      render: (ad: string) => <span className="!font-medium">{ad}</span>,
    },
    {
      title: 'Ekran',
      dataIndex: 'ekranAdi',
      render: (ekran: string) => {
        const t = ekranEtiket[ekran]
        return t ? <Tag color={t.color}>{t.label}</Tag> : <Tag>{ekran}</Tag>
      },
    },
    {
      title: 'PDF',
      render: (_: unknown, r: Sablon) => `${r.sayfaEn}x${r.sayfaBoy}mm / ${r.yon === 'yatay' ? 'Yatay' : 'Dikey'}`,
    },
    {
      title: 'Durum',
      dataIndex: 'aktif',
      render: (aktif: boolean) => <Tag color={aktif ? 'green' : 'default'}>{aktif ? 'Aktif' : 'Pasif'}</Tag>,
    },
    {
      title: 'Tarih',
      dataIndex: 'olusturmaTarihi',
      render: (t: string) => new Date(t).toLocaleDateString('tr-TR'),
    },
    {
      title: 'İşlem',
      render: (_: unknown, r: Sablon) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => onDuzenle(r.id)} />
          <Button size="small" icon={<CopyOutlined />} title="Kopyala" onClick={() => kopyalaAc(r)} />
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
        <div className="!flex !items-center !gap-1.5">
          <Input
            size="small"
            placeholder="Ara..."
            allowClear
            prefix={<SearchOutlined style={{ fontSize: 12, color: '#9ca3af' }} />}
            className="!w-52 !text-[12px]"
            value={arama}
            onChange={e => setArama(e.target.value)}
          />
          <Button size="small" icon={<ReloadOutlined />} onClick={yukle} className="!text-[12px] !h-7" />
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={onYeni} className="!text-[12px] !h-7">
            Yeni
          </Button>
        </div>
      </div>
      <Card size="small">
        <Table
          dataSource={filtrelenmis}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={false}
          loading={yukleniyor}
          locale={{ emptyText: 'Henüz rapor oluşturulmadı' }}
        />
      </Card>
      <Modal
        open={!!kopyalanan}
        title={<span className="!text-[13px] !font-semibold">Rapor Şablonunu Kopyala</span>}
        okText="Tamam"
        cancelText="Vazgeç"
        confirmLoading={kopyalaniyor}
        onOk={handleKopyala}
        onCancel={() => { if (!kopyalaniyor) setKopyalanan(null) }}
        destroyOnHidden
      >
        <div className="!flex !flex-col !gap-1 !mt-2">
          <div className="!text-[11px] !text-[#6b7280]">
            {kopyalanan ? `"${kopyalanan.ad}" şablonunun tüm içeriği birebir kopyalanır.` : ''}
          </div>
          <div className="!text-[10px] !text-[#6b7280] !mt-2">Rapor Şablon Adı</div>
          <Input
            size="small"
            value={kopyaAd}
            onChange={e => setKopyaAd(e.target.value)}
            onPressEnter={handleKopyala}
            placeholder="Yeni şablon adı"
          />
        </div>
      </Modal>
    </div>
  )
}
