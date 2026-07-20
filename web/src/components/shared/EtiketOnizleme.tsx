'use client'

import { Modal, Button } from 'antd'
import { PrinterOutlined } from '@ant-design/icons'
import BarkodEtiket, { type EtiketKalem } from './BarkodEtiket'

export interface EtiketFisBilgi {
  fisNo: string
  isEmriNo: string
  siparisNo: string
  tarih: string
}

export interface EtiketOnizlemeProps {
  open: boolean
  fis: EtiketFisBilgi
  kalemler: EtiketKalem[]
  onClose: () => void
}

export default function EtiketOnizleme({ open, fis, kalemler, onClose }: EtiketOnizlemeProps) {
  const basilacak = kalemler.filter((k) => k.malzemeKod)

  const handleYazdir = () => {
    window.print()
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={
        <div className="!flex !items-center !justify-end !gap-2">
          <Button size="small" onClick={onClose}>
            Kapat
          </Button>
          <Button size="small" type="primary" icon={<PrinterOutlined />} onClick={handleYazdir} disabled={basilacak.length === 0}>
            Yazdır
          </Button>
        </div>
      }
      width="auto"
      style={{ top: 20 }}
      styles={{ body: { padding: 16 } }}
      title={`Etiket Önizleme (${basilacak.length} adet)`}
    >
      <div className="etiket-yazdir-alan" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: '70vh', overflow: 'auto' }}>
        {basilacak.map((k, i) => (
          <BarkodEtiket
            key={i}
            fisNo={fis.fisNo}
            isEmriNo={fis.isEmriNo}
            siparisNo={fis.siparisNo}
            tarih={fis.tarih}
            kalem={k}
          />
        ))}
        {basilacak.length === 0 && <div className="!text-[12px] !text-gray-500">Yazdırılacak malzemeli satır yok.</div>}
      </div>
    </Modal>
  )
}
