'use client'

import { useState, useCallback, useRef } from 'react'
import { Button, Input, InputNumber, Select, Table, App, Tag, Card } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ScanOutlined, ScissorOutlined, ToolOutlined, InboxOutlined, FireOutlined, CheckCircleOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import type { IslemKarti } from './IslemKartlari'

export interface UretimHareket {
  id: number
  siparisNo: string
  modelKod: string
  modelAd: string
  renkAd: string
  beden: string
  islemKod: string
  islemAd: string
  miktar: number
  kalite: number
  birimFiyat: number | null
  cariAd: string | null
  tarih: string
  aciklama: string
  barkod: string
  kayitYapan: string
}

const mockSiparisler = [
  {
    siparisNo: 'SIP-2026-001',
    modeller: [
      {
        modelKod: 'BT001',
        modelAd: 'Basic Tişört',
        renkler: [
          { renkAd: 'Beyaz', bedenler: ['S', 'M', 'L', 'XL'] },
          { renkAd: 'Siyah', bedenler: ['S', 'M', 'L'] },
        ],
      },
      {
        modelKod: 'VE002',
        modelAd: 'Viskon Elbise',
        renkler: [
          { renkAd: 'Kırmızı', bedenler: ['36', '38', '40', '42'] },
        ],
      },
    ],
  },
  {
    siparisNo: 'SIP-2026-002',
    modeller: [
      {
        modelKod: 'PK003',
        modelAd: 'Pantolon',
        renkler: [
          { renkAd: 'Lacivert', bedenler: ['28', '30', '32', '34'] },
        ],
      },
    ],
  },
]

const islemIconlari: Record<string, React.ReactNode> = {
  KESIM: <ScissorOutlined />,
  DIKIM: <ToolOutlined />,
  PAKET: <InboxOutlined />,
  UTU: <FireOutlined />,
  KALITE: <CheckCircleOutlined />,
}

const islemRenkleri: Record<string, string> = {
  KESIM: '#1890ff',
  DIKIM: '#52c41a',
  PAKET: '#faad14',
  UTU: '#ff4d4f',
  KALITE: '#722ed1',
}

const defaultIslemler: IslemKarti[] = [
  { id: 1, kod: 'KESIM', ad: 'Kesim', birim: 'ADET', sira: 1, aktif: true },
  { id: 2, kod: 'DIKIM', ad: 'Dikim', birim: 'ADET', sira: 2, aktif: true },
  { id: 3, kod: 'PAKET', ad: 'Paket', birim: 'ADET', sira: 3, aktif: true },
  { id: 4, kod: 'UTU', ad: 'Ütüleme', birim: 'ADET', sira: 4, aktif: true },
  { id: 5, kod: 'KALITE', ad: 'Kalite Ktrl', birim: 'ADET', sira: 5, aktif: true },
]

export default function UretimHareketGirisi() {
  const { message } = App.useApp()
  const [hareketler, setHareketler] = useState<UretimHareket[]>([])
  const [barkodInput, setBarkodInput] = useState('')
  const barkodRef = useRef<HTMLInputElement>(null)

  const [seciliSiparis, setSeciliSiparis] = useState<string>('')
  const [seciliModel, setSeciliModel] = useState<string>('')
  const [seciliRenk, setSeciliRenk] = useState<string>('')
  const [seciliBeden, setSeciliBeden] = useState<string>('')
  const [seciliIslem, setSeciliIslem] = useState<string>('')
  const [miktar, setMiktar] = useState<number>(1)
  const [kalite, setKalite] = useState<number>(1)
  const [birimFiyat, setBirimFiyat] = useState<number | null>(null)
  const [cariAd, setCariAd] = useState<string>('')
  const [aciklama, setAciklama] = useState('')
  const [duzenlenenId, setDuzenlenenId] = useState<number | null>(null)

  const seciliSiparisData = mockSiparisler.find((s) => s.siparisNo === seciliSiparis)
  const seciliModelData = seciliSiparisData?.modeller.find((m) => m.modelKod === seciliModel)
  const seciliRenkData = seciliModelData?.renkler.find((r) => r.renkAd === seciliRenk)

  const barkodTara = useCallback(() => {
    if (!barkodInput.trim()) return
    const parsed = parseBarkod(barkodInput.trim())
    if (parsed) {
      setSeciliSiparis(parsed.siparisNo)
      setSeciliModel(parsed.modelKod)
      setSeciliRenk(parsed.renkAd)
      setSeciliBeden(parsed.beden)
      message.success(`Barkod okundu: ${parsed.siparisNo} / ${parsed.modelKod}`)
    } else {
      message.error('Geçersiz barkod formatı')
    }
    setBarkodInput('')
    barkodRef.current?.focus()
  }, [barkodInput, message])

  const kaydet = () => {
    if (!seciliSiparis || !seciliModel || !seciliIslem) {
      message.warning('Lütfen sipariş, model ve işlem seçin')
      return
    }
    const islem = defaultIslemler.find((i) => i.kod === seciliIslem)

    if (duzenlenenId !== null) {
      setHareketler((prev) =>
        prev.map((h) =>
          h.id === duzenlenenId
            ? {
                ...h,
                siparisNo: seciliSiparis,
                modelKod: seciliModel,
                modelAd: seciliModelData?.modelAd ?? h.modelAd,
                renkAd: seciliRenk || '-',
                beden: seciliBeden || '-',
                islemKod: seciliIslem,
                islemAd: islem?.ad ?? seciliIslem,
                miktar,
                kalite,
                birimFiyat,
                cariAd: cariAd || null,
                aciklama,
              }
            : h,
        ),
      )
      message.success('Hareket güncellendi')
    } else {
      const yeniHareket: UretimHareket = {
        id: Date.now(),
        siparisNo: seciliSiparis,
        modelKod: seciliModel,
        modelAd: seciliModelData?.modelAd ?? '',
        renkAd: seciliRenk || '-',
        beden: seciliBeden || '-',
        islemKod: seciliIslem,
        islemAd: islem?.ad ?? seciliIslem,
        miktar,
        kalite,
        birimFiyat,
        cariAd: cariAd || null,
        tarih: new Date().toISOString(),
        aciklama,
        barkod: generateBarkod(seciliSiparis, seciliModel, seciliRenk, seciliBeden),
        kayitYapan: 'Kullanıcı',
      }
      setHareketler((prev) => [yeniHareket, ...prev])
      message.success('Hareket kaydedildi')
    }
    temizle()
  }

  const temizle = () => {
    setSeciliIslem('')
    setMiktar(1)
    setKalite(1)
    setBirimFiyat(null)
    setCariAd('')
    setAciklama('')
    setDuzenlenenId(null)
    barkodRef.current?.focus()
  }

  const columns: ColumnsType<UretimHareket> = [
    { title: 'Tarih', dataIndex: 'tarih', width: 100, render: (v: string) => new Date(v).toLocaleDateString('tr-TR') },
    { title: 'Sipariş', dataIndex: 'siparisNo', width: 130 },
    { title: 'Model', dataIndex: 'modelKod', width: 80 },
    { title: 'Renk', dataIndex: 'renkAd', width: 80 },
    { title: 'Beden', dataIndex: 'beden', width: 60 },
    { title: 'İşlem', dataIndex: 'islemAd', width: 100 },
    { title: 'Miktar', dataIndex: 'miktar', width: 70, align: 'right' },
    {
      title: 'Kalite',
      width: 80,
      align: 'center',
      render: (_: unknown, r: UretimHareket) => (
        <Tag color={r.kalite === 1 ? 'green' : 'orange'}>
          {r.kalite}. Kalite
        </Tag>
      ),
    },
    { title: 'Birim Fiyat', dataIndex: 'birimFiyat', width: 90, align: 'right', render: (v: number | null) => v != null ? `${v.toFixed(2)} ₺` : '-' },
    { title: 'Cari', dataIndex: 'cariAd', width: 120, render: (v: string | null) => v ?? '-' },
    { title: 'Açıklama', dataIndex: 'aciklama', ellipsis: true },
    {
      title: '',
      width: 40,
      align: 'center',
      render: (_: unknown, r: UretimHareket) => (
        <Button
          type="link"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => setHareketler((prev) => prev.filter((h) => h.id !== r.id))}
        />
      ),
    },
  ]

  return (
    <div className="!p-3 flex flex-col gap-2 h-full">
      {/* Barkod Alanı */}
      <div className="flex gap-2 items-center">
        <ScanOutlined className="text-[16px] text-blue-500" />
        <Input
          ref={barkodRef as never}
          placeholder="Barkod okutun veya yazın..."
          value={barkodInput}
          onChange={(e) => setBarkodInput(e.target.value)}
          onPressEnter={barkodTara}
          className="!text-[13px] !flex-1"
          prefix={<SearchOutlined className="text-gray-400" />}
          suffix={
            <Button type="link" size="small" onClick={barkodTara} className="!px-0">
              Tara
            </Button>
          }
        />
      </div>

      {/* 3 Kolonlu Yapı */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* Sol Kolon: Sipariş Bilgileri */}
        <Card size="small" className="!mb-0" title={<span className="text-[10px] text-gray-500">Sipariş Bilgileri</span>}>
          <div className="space-y-2">
            <div>
              <div className="text-[9px] text-gray-400 mb-0.5 uppercase">Sipariş</div>
              <Select
                className="!w-full"
                size="small"
                placeholder="Sipariş seçin"
                value={seciliSiparis || undefined}
                onChange={(v) => {
                  setSeciliSiparis(v)
                  setSeciliModel('')
                  setSeciliRenk('')
                  setSeciliBeden('')
                }}
                options={mockSiparisler.map((s) => ({ label: s.siparisNo, value: s.siparisNo }))}
              />
            </div>
            <div>
              <div className="text-[9px] text-gray-400 mb-0.5 uppercase">Model</div>
              <Select
                className="!w-full"
                size="small"
                placeholder="Model seçin"
                value={seciliModel || undefined}
                onChange={(v) => {
                  setSeciliModel(v)
                  setSeciliRenk('')
                  setSeciliBeden('')
                }}
                disabled={!seciliSiparis}
                options={seciliSiparisData?.modeller.map((m) => ({ label: `${m.modelKod} - ${m.modelAd}`, value: m.modelKod })) ?? []}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[9px] text-gray-400 mb-0.5 uppercase">Renk</div>
                <Select
                  className="!w-full"
                  size="small"
                  placeholder="Renk"
                  value={seciliRenk || undefined}
                  onChange={(v) => {
                    setSeciliRenk(v)
                    setSeciliBeden('')
                  }}
                  allowClear
                  disabled={!seciliModel}
                  options={seciliModelData?.renkler.map((r) => ({ label: r.renkAd, value: r.renkAd })) ?? []}
                />
              </div>
              <div>
                <div className="text-[9px] text-gray-400 mb-0.5 uppercase">Beden</div>
                <Select
                  className="!w-full"
                  size="small"
                  placeholder="Beden"
                  value={seciliBeden || undefined}
                  onChange={setSeciliBeden}
                  allowClear
                  disabled={!seciliRenk}
                  options={seciliRenkData?.bedenler.map((b) => ({ label: b, value: b })) ?? []}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Orta Kolon: İşlem Seçimi (Radio Card) */}
        <Card size="small" className="!mb-0" title={<span className="text-[10px] text-gray-500">İşlem Tipi</span>}>
          <div className="grid grid-cols-3 gap-1.5">
            {defaultIslemler.filter((i) => i.aktif).map((islem) => {
              const secili = seciliIslem === islem.kod
              return (
                <div
                  key={islem.kod}
                  onClick={() => setSeciliIslem(islem.kod)}
                  className={`
                    flex flex-col items-center justify-center gap-1 p-2 rounded cursor-pointer border transition-all
                    ${secili
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div
                    className="text-[18px]"
                    style={{ color: secili ? islemRenkleri[islem.kod] : '#9ca3af' }}
                  >
                    {islemIconlari[islem.kod]}
                  </div>
                  <div className={`text-[10px] font-medium ${secili ? 'text-blue-600' : 'text-gray-600'}`}>
                    {islem.ad}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Sağ Kolon: Miktar, Kalite, Fiyat */}
        <Card size="small" className="!mb-0" title={<span className="text-[10px] text-gray-500">Miktar & Kalite</span>}>
          <div className="space-y-2">
            <div>
              <div className="text-[9px] text-gray-400 mb-0.5 uppercase">Miktar</div>
              <InputNumber
                className="!w-full"
                size="small"
                min={1}
                value={miktar}
                onChange={(v) => setMiktar(v ?? 1)}
              />
            </div>
            <div>
              <div className="text-[9px] text-gray-400 mb-1 uppercase">Kalite</div>
              <div className="flex gap-2">
                <div
                  onClick={() => setKalite(1)}
                  className={`
                    flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded cursor-pointer border transition-all
                    ${kalite === 1
                      ? 'border-green-500 bg-green-50 text-green-600'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }
                  `}
                >
                  <CheckCircleOutlined className="text-[12px]" />
                  <span className="text-[10px] font-medium">1. Kalite</span>
                </div>
                <div
                  onClick={() => setKalite(2)}
                  className={`
                    flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded cursor-pointer border transition-all
                    ${kalite === 2
                      ? 'border-orange-500 bg-orange-50 text-orange-600'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }
                  `}
                >
                  <CheckCircleOutlined className="text-[12px]" />
                  <span className="text-[10px] font-medium">2. Kalite</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[9px] text-gray-400 mb-0.5 uppercase">Birim Fiyat (₺)</div>
                <InputNumber
                  className="!w-full"
                  size="small"
                  min={0}
                  precision={2}
                  value={birimFiyat}
                  onChange={setBirimFiyat}
                />
              </div>
              <div>
                <div className="text-[9px] text-gray-400 mb-0.5 uppercase">Fason Firma</div>
                <Input
                  size="small"
                  placeholder="Cari hesap"
                  value={cariAd}
                  onChange={(e) => setCariAd(e.target.value)}
                />
              </div>
            </div>
            <div>
              <div className="text-[9px] text-gray-400 mb-0.5 uppercase">Açıklama</div>
              <Input
                size="small"
                placeholder="Opsiyonel açıklama"
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
              />
            </div>
            <Button type="primary" size="small" onClick={kaydet} className="!w-full" disabled={!seciliIslem}>
              {duzenlenenId !== null ? 'Güncelle' : 'Kaydet'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Hareket Tablosu */}
      <div className="flex-1 overflow-hidden">
        <Table<UretimHareket>
          size="small"
          columns={columns}
          dataSource={hareketler}
          rowKey="id"
          pagination={{ pageSize: 20, size: 'small', showSizeChanger: false }}
          scroll={{ y: 'calc(100vh - 420px)' }}
          locale={{ emptyText: 'Henüz hareket girilmedi' }}
          rowClassName={(record) => record.id === duzenlenenId ? 'bg-blue-50 cursor-pointer' : 'cursor-pointer'}
          onRow={(record) => ({
            onClick: () => {
              setDuzenlenenId(record.id)
              setSeciliSiparis(record.siparisNo)
              setSeciliModel(record.modelKod)
              setSeciliRenk(record.renkAd === '-' ? '' : record.renkAd)
              setSeciliBeden(record.beden === '-' ? '' : record.beden)
              setSeciliIslem(record.islemKod)
              setMiktar(record.miktar)
              setKalite(record.kalite)
              setBirimFiyat(record.birimFiyat)
              setCariAd(record.cariAd ?? '')
              setAciklama(record.aciklama)
            },
          })}
        />
      </div>
    </div>
  )
}

function parseBarkod(barkod: string): { siparisNo: string; modelKod: string; renkAd: string; beden: string } | null {
  const parts = barkod.split('-')
  if (parts.length >= 4) {
    return {
      siparisNo: parts.slice(0, 2).join('-'),
      modelKod: parts[2] || '',
      renkAd: parts[3] || '',
      beden: parts[4] || '',
    }
  }
  if (parts.length === 3) {
    return {
      siparisNo: parts[0],
      modelKod: parts[1],
      renkAd: parts[2],
      beden: '',
    }
  }
  return null
}

function generateBarkod(siparisNo: string, modelKod: string, renkAd: string, beden: string): string {
  return `${siparisNo}-${modelKod}-${renkAd}-${beden}`.replace(/\s+/g, '')
}
