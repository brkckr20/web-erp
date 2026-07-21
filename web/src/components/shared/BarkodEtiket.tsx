'use client'

import { useEffect, useRef } from 'react'
import { toCanvas } from '@bwip-js/browser'

export interface EtiketKalem {
  barkod: string
  malzemeKod: string
  malzemeAd: string
  kg: number
  mt: number
  adet: number
  hatalar: { hataKodu: string; hataAdi: string; miktar?: number }[]
}

export interface BarkodEtiketProps {
  fisNo: string
  isEmriNo: string
  siparisNo: string
  tarih: string
  kalem: EtiketKalem
}

export default function BarkodEtiket({ fisNo, isEmriNo, siparisNo, tarih, kalem }: BarkodEtiketProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !kalem.barkod) return
    try {
      toCanvas(canvasRef.current, {
        bcid: 'code128',
        text: kalem.barkod,
        scale: 3,
        height: 12,
        includetext: true,
        textxalign: 'center',
        textsize: 9,
      })
    } catch {
      // barkod üretilemedi
    }
  }, [kalem.barkod])

  const fmt = (v: number) => (v ? new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) : '')

  return (
    <div
      className="barkod-etiket"
      style={{
        width: '100mm',
        height: '150mm',
        boxSizing: 'border-box',
        padding: '6mm 5mm',
        border: '1px solid #ccc',
        fontSize: 11,
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        background: 'white',
        pageBreakAfter: 'always',
      }}
    >
      <div style={{ fontWeight: 'bold', fontSize: 13 }}>KK FİŞ: {fisNo}</div>
      <div>İş Emri: {isEmriNo || '-'}</div>
      <div>Sipariş : {siparisNo || '-'}</div>
      <div>Tarih  : {tarih}</div>
      <hr style={{ width: '100%', border: 'none', borderTop: '1px solid #999', margin: '4px 0' }} />
      <div style={{ fontWeight: 'bold' }}>Malzeme: {kalem.malzemeKod}</div>
      <div style={{ fontSize: 10 }}>{kalem.malzemeAd}</div>
      <hr style={{ width: '100%', border: 'none', borderTop: '1px solid #999', margin: '4px 0' }} />
      <div style={{ display: 'flex', gap: 16 }}>
        {kalem.kg ? <span>Kg: {fmt(kalem.kg)}</span> : null}
        {kalem.mt ? <span>Mt: {fmt(kalem.mt)}</span> : null}
        {kalem.adet ? <span>Adet: {kalem.adet}</span> : null}
      </div>
      {kalem.hatalar && kalem.hatalar.length > 0 ? (
        <>
          <hr style={{ width: '100%', border: 'none', borderTop: '1px solid #999', margin: '4px 0' }} />
          <div style={{ fontWeight: 'bold', fontSize: 10 }}>HATALAR</div>
          {kalem.hatalar.map((h, i) => (
            <div key={i} style={{ fontSize: 10 }}>
              ▸ {h.hataKodu} {h.hataAdi} {h.miktar ? `x${h.miktar}` : ''}
            </div>
          ))}
        </>
      ) : null}
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <canvas ref={canvasRef} style={{ maxWidth: '100%' }} />
      </div>
      <div style={{ textAlign: 'center', fontSize: 10 }}>{kalem.barkod}</div>
    </div>
  )
}
