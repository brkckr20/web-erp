'use client'

import { useState, useEffect, useRef } from 'react'
import { Modal, Input, Button, Table, App, InputRef } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import SearchableSelect from '@/components/shared/SearchableSelect'
import { hataTanimApi } from '@/lib/hata-tanim-api'

interface HataEntry {
  key: string
  hataKodu: string
  hataAdi: string
  miktar: number
  aciklama?: string
}

let hataKeyCounter = 0

interface HataModalProps {
  open: boolean
  hatalar: HataEntry[]
  onClose: () => void
  onSave: (hatalar: HataEntry[]) => void
}

export default function HataModal({ open, hatalar: initialHatalar, onClose, onSave }: HataModalProps) {
  const { message } = App.useApp()
  const [hatalar, setHatalar] = useState<HataEntry[]>(initialHatalar)
  const [hataKodu, setHataKodu] = useState('')
  const [hataAdi, setHataAdi] = useState('')
  const [miktar, setMiktar] = useState(1)
  const [aciklama, setAciklama] = useState('')
  const miktarRef = useRef<InputRef>(null)

  useEffect(() => {
    if (open) {
      setHatalar(initialHatalar.map((h) => ({ ...h, miktar: h.miktar ?? 1, key: h.key || `hata-${++hataKeyCounter}` })))
      setHataKodu('')
      setHataAdi('')
      setMiktar(1)
      setAciklama('')
    }
  }, [open, initialHatalar])

  const handleEkle = () => {
    if (!hataKodu.trim() || !hataAdi.trim()) {
      message.warning('Hata kodu ve adı zorunludur')
      return
    }
    setHatalar((prev) => [...prev, {
      key: `hata-${++hataKeyCounter}`,
      hataKodu: hataKodu.trim(),
      hataAdi: hataAdi.trim(),
      miktar: Math.max(1, miktar || 1),
      aciklama: aciklama.trim() || undefined,
    }])
    setHataKodu('')
    setHataAdi('')
    setMiktar(1)
    setAciklama('')
  }

  const handleSil = (key: string) => {
    setHatalar((prev) => prev.filter((h) => h.key !== key))
  }

  const handleKaydet = () => {
    onSave(hatalar)
    onClose()
  }

  const handleKaydetYazdir = () => {
    onSave(hatalar)
    message.info('Yazdırma henüz uygulanmadı')
    onClose()
  }

  return (
    <Modal
      title="Hata Kaydı"
      open={open}
      onCancel={onClose}
      footer={
        <div className="!flex !items-center !justify-end !gap-2">
          <Button size="small" type="primary" onClick={handleKaydet}>
            Kaydet
          </Button>
          <Button size="small" onClick={handleKaydetYazdir}>
            Kaydet ve Yazdır
          </Button>
          <Button size="small" onClick={onClose}>
            İptal
          </Button>
        </div>
      }
      width={700}
      destroyOnHidden
    >
      <div className="!flex !gap-2 !mb-3">
        <SearchableSelect
          value={hataKodu}
          onChange={(kod, rec) => {
            setHataKodu(kod)
            setHataAdi(rec?.ad ?? '')
            setTimeout(() => {
              miktarRef.current?.focus()
              miktarRef.current?.select()
            }, 0)
          }}
          placeholder="Hata Kodu"
          widthClass="!w-28"
          fetchList={async () => {
            const list = await hataTanimApi.list()
            return list.map((h) => ({ kod: h.hataKodu, ad: h.hataAdi }))
          }}
          searchLabel={(item) => `${item.kod} - ${item.ad}`}
          hideAdLabel
        />
        <Input size="small" placeholder="Hata Adı" value={hataAdi} readOnly className="!flex-1 !text-[12px] !bg-gray-100" />
        <Input ref={miktarRef} size="small" type="number" min={1} placeholder="Miktar" value={miktar} onChange={(e) => setMiktar(Number(e.target.value))} className="!w-20 !text-[12px]" />
        <Input size="small" placeholder="Açıklama" value={aciklama} onChange={(e) => setAciklama(e.target.value)} className="!w-32 !text-[12px]" />
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleEkle} disabled={!hataKodu.trim() || !hataAdi.trim()}>
          Ekle
        </Button>
      </div>
      <Table
        dataSource={hatalar}
        rowKey="key"
        size="small"
        pagination={false}
        columns={[
          { title: 'Hata Kodu', dataIndex: 'hataKodu', width: 100 },
          { title: 'Hata Adı', dataIndex: 'hataAdi', flex: 1 },
          { title: 'Miktar', dataIndex: 'miktar', width: 70 },
          {
            title: '',
            key: 'action',
            width: 40,
            render: (_: unknown, rec: HataEntry) => (
              <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => handleSil(rec.key)} />
            ),
          },
        ]}
      />
    </Modal>
  )
}
