'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Table, Tag, Button, App, Dropdown, Input, Space } from 'antd'
import type { ColumnsType, MenuProps } from 'antd/es/table'
import {
  UndoOutlined,
  FileTextOutlined,
  SearchOutlined,
  StopOutlined,
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { iadeTalepApi, type IadeTalep } from '@/lib/iade-talep-api'

interface IadeTalepleriProps {
  onIrsaliyeAc?: (info: { id: number; irsaliyeTipi: string; irsaliyeNo: string }) => void
}

const mockTalepler: IadeTalep[] = []

export default function IadeTalepleri({ onIrsaliyeAc }: IadeTalepleriProps) {
  const { message, modal } = App.useApp()
  const mountedRef = useRef(true)
  const [talepler, setTalepler] = useState<IadeTalep[]>(mockTalepler)
  const [loading, setLoading] = useState(false)
  const [arama, setArama] = useState('')
  const [durumFiltre, setDurumFiltre] = useState<string | undefined>(undefined)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const veriYukle = useCallback(async () => {
    setLoading(true)
    try {
      const data = await iadeTalepApi.list(durumFiltre)
      if (mountedRef.current) setTalepler(data)
    } catch {
      if (mountedRef.current) setTalepler([])
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [durumFiltre])

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(async () => {
      if (cancelled) return
      try {
        setLoading(true)
        const data = await iadeTalepApi.list(durumFiltre)
        if (!cancelled && mountedRef.current) setTalepler(data)
      } catch {
        if (!cancelled && mountedRef.current) setTalepler([])
      } finally {
        if (!cancelled && mountedRef.current) setLoading(false)
      }
    }, 100)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [durumFiltre])

  const handleIrsaliyeOlustur = (id: number) => {
    modal.confirm({
      title: 'İrsaliye Oluştur',
      content: 'Bu talep için 40 - Üretimden İade irsaliyesi oluşturulacak. Onaylıyor musunuz?',
      okText: 'Oluştur',
      cancelText: 'İptal',
      onOk: async () => {
        try {
          const irsaliye = await iadeTalepApi.irsaliyeOlustur(id)
          message.success('İrsaliye başarıyla oluşturuldu')
          veriYukle()
          if (onIrsaliyeAc && irsaliye) {
            onIrsaliyeAc({
              id: irsaliye.id,
              irsaliyeTipi: '40',
              irsaliyeNo: irsaliye.irsaliyeNo,
            })
          }
        } catch (err: any) {
          message.error(err?.message || 'İrsaliye oluşturulurken hata oluştu')
        }
      },
    })
  }

  const handleIptal = (id: number) => {
    modal.confirm({
      title: 'Talebi İptal Et',
      content: 'Bu talep iptal edilecek. Onaylıyor musunuz?',
      okText: 'İptal Et',
      cancelText: 'Vazgeç',
      onOk: async () => {
        try {
          await iadeTalepApi.iptal(id)
          message.success('Talep iptal edildi')
          veriYukle()
        } catch {
          message.error('İptal işlemi sırasında hata oluştu')
        }
      },
    })
  }

  const handleSil = (id: number) => {
    modal.confirm({
      title: 'Talebi Sil',
      content: 'Bu talep kalıcı olarak silinecek. Onaylıyor musunuz?',
      okText: 'Sil',
      cancelText: 'Vazgeç',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await iadeTalepApi.remove(id)
          message.success('Talep silindi')
          veriYukle()
        } catch (err: any) {
          message.error(err?.message || 'Silme işlemi sırasında hata oluştu')
        }
      },
    })
  }

  const filtrelenmisTalepler = talepler.filter((t) => {
    if (!arama) return true
    const a = arama.toLowerCase()
    return (
      t.siparisNo.toLowerCase().includes(a) ||
      t.modelKod.toLowerCase().includes(a) ||
      t.renkAd.toLowerCase().includes(a) ||
      t.beden.toLowerCase().includes(a) ||
      (t.kumasAd && t.kumasAd.toLowerCase().includes(a))
    )
  })

  const durumRenk = (durum: string) => {
    switch (durum) {
      case 'BEKLEMEDE': return 'orange'
      case 'IRSALIYE_OLUSTURULDU': return 'green'
      case 'IPTAL': return 'red'
      default: return 'default'
    }
  }

  const durumEtiket = (durum: string) => {
    switch (durum) {
      case 'BEKLEMEDE': return 'Beklemede'
      case 'IRSALIYE_OLUSTURULDU': return 'İrsaliye Oluşturuldu'
      case 'IPTAL': return 'İptal'
      default: return durum
    }
  }

  const columns: ColumnsType<IadeTalep> = [
    {
      title: 'Tarih',
      dataIndex: 'olusturmaTarihi',
      width: 90,
      render: (v: string) => new Date(v).toLocaleDateString('tr-TR'),
    },
    { title: 'Sipariş', dataIndex: 'siparisNo', width: 120 },
    { title: 'Model', dataIndex: 'modelKod', width: 70 },
    { title: 'Renk', dataIndex: 'renkAd', width: 80 },
    { title: 'Beden', dataIndex: 'beden', width: 50 },
    { title: 'Kumaş', dataIndex: 'kumasAd', width: 120, render: (v: string, r) => v ? `${v}${r.kumasRenk ? ` (${r.kumasRenk})` : ''}` : '-' },
    {
      title: 'Kalan MT',
      dataIndex: 'kalanMT',
      width: 80,
      align: 'right',
      render: (v: number) => <span className="text-orange-500 font-medium">{v.toFixed(2)} MT</span>,
    },
    {
      title: 'Durum',
      dataIndex: 'durum',
      width: 130,
      align: 'center',
      render: (v: string) => <Tag color={durumRenk(v)}>{durumEtiket(v)}</Tag>,
    },
    {
      title: 'İşlenme',
      dataIndex: 'islenmeTarihi',
      width: 90,
      render: (v: string | null) => v ? new Date(v).toLocaleDateString('tr-TR') : '-',
    },
    {
      title: '',
      width: 30,
      align: 'center',
      render: (_: unknown, record: IadeTalep) => {
        const menuItems: MenuProps['items'] = [
          ...(record.durum === 'BEKLEMEDE'
            ? [
                {
                  key: 'irsaliye',
                  label: 'İrsaliye Oluştur',
                  icon: <FileTextOutlined />,
                  onClick: () => handleIrsaliyeOlustur(record.id),
                },
                {
                  key: 'iptal',
                  label: 'İptal Et',
                  icon: <StopOutlined />,
                  danger: true,
                  onClick: () => handleIptal(record.id),
                },
              ]
            : []),
          ...(record.durum !== 'IRSALIYE_OLUSTURULDU'
            ? [
                {
                  key: 'sil',
                  label: 'Sil',
                  icon: <StopOutlined />,
                  danger: true,
                  onClick: () => handleSil(record.id),
                },
              ]
            : []),
        ]

        return menuItems.length > 0 ? (
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button type="text" size="small" icon={<EyeOutlined />} />
          </Dropdown>
        ) : null
      },
    },
  ]

  return (
    <div className="!p-3 flex flex-col gap-2 h-full">
      {/* Başlık */}
      <div className="flex items-center gap-2">
        <UndoOutlined className="text-[16px] text-orange-500" />
        <span className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider">
          İade Talepleri
        </span>
      </div>

      {/* Filtreler */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Sipariş, model, renk, beden, kumaş ara..."
          prefix={<SearchOutlined className="text-gray-400" />}
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          className="!w-60"
          size="small"
          allowClear
        />
        <Space size={4}>
          {[
            { value: undefined, label: 'Tümü' },
            { value: 'BEKLEMEDE', label: 'Beklemede' },
            { value: 'IRSALIYE_OLUSTURULDU', label: 'İrsaliye Oluşturuldu' },
            { value: 'IPTAL', label: 'İptal' },
          ].map((f) => (
            <Button
              key={f.label}
              size="small"
              type={durumFiltre === f.value ? 'primary' : 'default'}
              onClick={() => setDurumFiltre(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </Space>
        <Button size="small" icon={<ReloadOutlined />} onClick={veriYukle}>
          Yenile
        </Button>
      </div>

      {/* Tablo */}
      <div className="flex-1 overflow-hidden">
        <Table<IadeTalep>
          size="small"
          columns={columns}
          dataSource={filtrelenmisTalepler}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, size: 'small', showSizeChanger: false }}
          scroll={{ y: 'calc(100vh - 380px)' }}
          locale={{ emptyText: 'İade talebi bulunamadı' }}
        />
      </div>
    </div>
  )
}
