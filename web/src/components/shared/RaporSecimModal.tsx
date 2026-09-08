'use client'

import { useEffect, useState } from 'react'
import { Modal, Select, Button, Typography, Spin, Input, App } from 'antd'
import { EyeOutlined, DownloadOutlined } from '@ant-design/icons'
import { sablonApi, type Sablon } from '@/lib/sablon-api'

interface RaporSecimModalProps {
  open: boolean
  ekranAdi: string
  parametreler?: Record<string, any>
  onCancel: () => void
}

export default function RaporSecimModal({
  open,
  ekranAdi,
  parametreler,
  onCancel,
}: RaporSecimModalProps) {
  const { message } = App.useApp()
  const [sablonlar, setSablonlar] = useState<Sablon[]>([])
  const [seciliId, setSeciliId] = useState<number | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [islem, setIslem] = useState<'onerizle' | 'pdf' | null>(null)

  useEffect(() => {
    if (open && ekranAdi) {
      sablonlariYukle()
    }
  }, [open, ekranAdi])

  useEffect(() => {
    if (sablonlar.length > 0 && !seciliId) {
      setSeciliId(sablonlar[0].id)
    }
  }, [sablonlar])

  const sablonlariYukle = async () => {
    setYukleniyor(true)
    try {
      const data = await sablonApi.list(ekranAdi)
      setSablonlar(data.filter((s) => s.aktif))
    } catch {
      message.error('Şablonlar yüklenemedi')
    } finally {
      setYukleniyor(false)
    }
  }

  const handleOnizle = async () => {
    if (!seciliId) return
    setIslem('onerizle')
    try {
      const url = sablonApi.pdfUrl(seciliId)
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ parametreler }),
      })

      if (!res.ok) throw new Error('PDF oluşturulamadı')

      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      window.open(blobUrl, '_blank', 'toolbar=0,menubar=0,location=0,status=0,scrollbars=1,width=900,height=700')
    } catch {
      message.error('Önizleme oluşturulamadı')
    } finally {
      setIslem(null)
    }
  }

  const handleIndir = async () => {
    if (!seciliId) return
    setIslem('pdf')
    try {
      const url = sablonApi.pdfUrl(seciliId)
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ parametreler }),
      })

      if (!res.ok) throw new Error('PDF oluşturulamadı')

      const blob = await res.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `rapor-${seciliId}.pdf`
      link.click()
      URL.revokeObjectURL(link.href)
    } catch {
      message.error('PDF indirilemedi')
    } finally {
      setIslem(null)
    }
  }

  const seciliSablon = sablonlar.find((s) => s.id === seciliId)

  return (
    <Modal
      open={open}
      title={<span className="!text-[13px] !font-semibold">Rapor Seç</span>}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" size="small" onClick={onCancel} className="!text-[12px]">
          Vazgeç
        </Button>,
        <Button
          key="preview"
          size="small"
          icon={<EyeOutlined />}
          onClick={handleOnizle}
          loading={islem === 'onerizle'}
          disabled={!seciliId || sablonlar.length === 0}
          className="!text-[12px]"
        >
          Önizleme
        </Button>,
        <Button
          key="download"
          size="small"
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleIndir}
          loading={islem === 'pdf'}
          disabled={!seciliId || sablonlar.length === 0}
          className="!text-[12px]"
        >
          PDF İndir
        </Button>,
      ]}
      width={420}
      destroyOnHidden
      afterClose={() => {
        setSablonlar([])
        setSeciliId(null)
      }}
    >
      <div className="!flex !flex-col !gap-2 !mt-2">
        {yukleniyor ? (
          <div className="!flex !justify-center !py-4"><Spin /></div>
        ) : sablonlar.length === 0 ? (
          <Typography.Text type="secondary" className="!text-[11px]">
            Bu ekran için tanımlı rapor şablonu bulunamadı.
          </Typography.Text>
        ) : (
          <>
            <Typography.Text type="secondary" className="!text-[11px]">
              Açılacak raporu seçin. Önizleme yeni sekmede açılır; gerekirse oradan indirin.
            </Typography.Text>
            <div className="!flex !items-center !gap-2">
              <span className="!text-[12px] !text-[#6b7280] !w-16 !shrink-0">Rapor</span>
              <Select
                size="small"
                value={seciliId}
                onChange={setSeciliId}
                className="!flex-1 !text-[12px]"
                options={sablonlar.map((s) => ({
                  value: s.id,
                  label: `${s.ad} (${s.sayfaEn}x${s.sayfaBoy}mm ${s.yon === 'yatay' ? 'Yatay' : 'Dikey'})`,
                }))}
              />
            </div>
            {seciliSablon && (
              <div className="!pl-[72px] !flex !flex-col !gap-1">
                <Typography.Text type="secondary" className="!text-[10px]">
                  {seciliSablon.sorgular.length} sorgu tanımlı
                </Typography.Text>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
