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
    const el = document.querySelector('.etiket-yazdir-alan')
    if (!el) return
    const canvases = el.querySelectorAll<HTMLCanvasElement>('canvas')
    const replacements = new Map<HTMLCanvasElement, string>()
    canvases.forEach((c) => {
      try { replacements.set(c, c.toDataURL()) } catch {}
    })
    const html = Array.from(el.querySelectorAll<HTMLElement>('.barkod-etiket'))
      .map((c) => {
        let h = c.outerHTML
        const cvs = c.querySelector('canvas')
        if (cvs && replacements.has(cvs)) {
          h = h.replace('<canvas', `<img src="${replacements.get(cvs)}" style="max-width:100%"`).replace('</canvas>', '')
        }
        return h
      })
      .join('')
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`
      <html><head><title>Etiket</title>
      <style>
        @page { margin: 0; size: 100mm 150mm; }
        body { margin: 0; padding: 0; display: flex; flex-wrap: wrap; }
        .barkod-etiket { width: 100mm; height: 150mm; box-sizing: border-box; padding: 6mm 5mm; border: none; font-size: 11px; font-family: Arial, sans-serif; display: flex; flex-direction: column; gap: 4px; background: white; page-break-after: always; }
        hr { width: 100%; border: none; border-top: 1px solid #999; margin: 4px 0; text-align: left; }
        [style*="display: flex; gap:"] { display: flex; gap: 16px; }
      </style></head><body>${html}</body></html>
    `)
    w.document.close()
    setTimeout(() => { w.print(); w.close() }, 500)
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
      width={basilacak.length <= 2 ? 460 : 800}
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
