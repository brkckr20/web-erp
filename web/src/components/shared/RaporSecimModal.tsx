'use client'

import { Modal, Select, Button, Typography } from 'antd'
import { EyeOutlined, DownloadOutlined } from '@ant-design/icons'
import { useState } from 'react'

export interface RaporTasarimSecenek {
  id: string
  label: string
  aciklama?: string
}

interface RaporSecimModalProps {
  open: boolean
  baslik: string
  tasarimlar: RaporTasarimSecenek[]
  onCancel: () => void
  onOnizle: (tasarimId: string) => void
  onIndir: (tasarimId: string) => void
}

export default function RaporSecimModal({
  open,
  baslik,
  tasarimlar,
  onCancel,
  onOnizle,
  onIndir,
}: RaporSecimModalProps) {
  const [secili, setSecili] = useState<string>(tasarimlar[0]?.id ?? '')

  return (
    <Modal
      open={open}
      title={<span className="!text-[13px] !font-semibold">Rapor Seç — {baslik}</span>}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" size="small" onClick={onCancel} className="!text-[12px]">
          Vazgeç
        </Button>,
        <Button
          key="preview"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => onOnizle(secili)}
          className="!text-[12px]"
        >
          Önizleme
        </Button>,
        <Button
          key="download"
          size="small"
          type="primary"
          icon={<DownloadOutlined />}
          onClick={() => onIndir(secili)}
          className="!text-[12px]"
        >
          İndir
        </Button>,
      ]}
      width={420}
      destroyOnHidden
      afterClose={() => setSecili(tasarimlar[0]?.id ?? '')}
    >
      <div className="!flex !flex-col !gap-2 !mt-2">
        <Typography.Text type="secondary" className="!text-[11px]">
          Açılacak raporu seçin. Önizleme yeni sekmede açılır; gerekirse oradan indirin.
        </Typography.Text>
        <div className="!flex !items-center !gap-2">
          <span className="!text-[12px] !text-[#6b7280] !w-16 !shrink-0">Rapor</span>
          <Select
            size="small"
            value={secili}
            onChange={setSecili}
            className="!flex-1 !text-[12px]"
            options={tasarimlar.map((t) => ({ value: t.id, label: t.label }))}
          />
        </div>
        {tasarimlar.find((t) => t.id === secili)?.aciklama && (
          <Typography.Text type="secondary" className="!text-[11px] !pl-[72px]">
            {tasarimlar.find((t) => t.id === secili)?.aciklama}
          </Typography.Text>
        )}
      </div>
    </Modal>
  )
}
