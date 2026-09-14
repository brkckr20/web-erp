'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button, Input, InputNumber, Select, Table, App, Tag, Card, DatePicker } from 'antd'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import { ScanOutlined, ScissorOutlined, ToolOutlined, InboxOutlined, FireOutlined, CheckCircleOutlined, DeleteOutlined, SearchOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import type { IslemKarti } from './IslemKartlari'
import { dovizApi, type DovizKuruSatir } from '../../lib/doviz-api'
import SearchableCariSelect from '@/components/shared/SearchableCariSelect'

export interface UretimHareket {
  id: number
  siparisNo: string
  modelKod: string
  modelAd: string
  renkAd: string
  beden: string
  islemKod: string
  islemAd: string
  yon: 'gidis' | 'gelis'
  miktar: number
  kalite: string
  birimFiyat: number | null
  dovizCinsi: string
  dovizKuru: number | null
  cariKod: string | null
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

const mockKurlar: DovizKuruSatir[] = [
  { dovizKodu: 'USD', dovizAd: 'Amerikan Doları', alisKuru: 34.25, satisKuru: 34.32, tarih: null },
  { dovizKodu: 'EUR', dovizAd: 'Euro', alisKuru: 37.10, satisKuru: 37.22, tarih: null },
  { dovizKodu: 'GBP', dovizAd: 'İngiliz Sterlini', alisKuru: 43.50, satisKuru: 43.68, tarih: null },
]

export default function UretimHareketGirisi() {
  const { message, modal } = App.useApp()
  const [hareketler, setHareketler] = useState<UretimHareket[]>([])
  const [barkodInput, setBarkodInput] = useState('')
  const barkodRef = useRef<HTMLInputElement>(null)

  const [seciliSiparis, setSeciliSiparis] = useState<string>('')
  const [seciliModel, setSeciliModel] = useState<string>('')
  const [seciliRenk, setSeciliRenk] = useState<string>('')
  const [seciliBeden, setSeciliBeden] = useState<string>('')
  const [seciliIslem, setSeciliIslem] = useState<string>('')
  const [yon, setYon] = useState<'gidis' | 'gelis'>('gidis')
  const [kalite, setKalite] = useState<string>('Sağlam')
  const [birimFiyat, setBirimFiyat] = useState<number | null>(null)
  const [cariKod, setCariKod] = useState<string>('')
  const [cariAd, setCariAd] = useState<string>('')
  const [aciklama, setAciklama] = useState('')
  const [duzenlenenId, setDuzenlenenId] = useState<number | null>(null)
  const [tarih, setTarih] = useState(dayjs())
  const [bedenAdetler, setBedenAdetler] = useState<Record<string, number | null>>({})
  const [dovizCinsi, setDovizCinsi] = useState<string>('TL')
  const [dovizKuru, setDovizKuru] = useState<number | null>(1)
  const [kurlar, setKurlar] = useState<DovizKuruSatir[]>([])

  const efektikKurlar = kurlar.length > 0 ? kurlar : mockKurlar

  useEffect(() => {
    dovizApi.getSonKurlar().then(setKurlar).catch(() => setKurlar(mockKurlar))
  }, [])

  useEffect(() => {
    if (dovizCinsi === 'TL') {
      setDovizKuru(1)
    } else {
      const k = efektikKurlar.find((k) => k.dovizKodu === dovizCinsi)
      if (k?.satisKuru) setDovizKuru(k.satisKuru)
    }
  }, [dovizCinsi, kurlar])

  const seciliSiparisData = mockSiparisler.find((s) => s.siparisNo === seciliSiparis)
  const seciliModelData = seciliSiparisData?.modeller.find((m) => m.modelKod === seciliModel)
  const seciliRenkData = seciliModelData?.renkler.find((r) => r.renkAd === seciliRenk)

  // Gidiş/Geliş eşleşmesi: sipariş+model+renk(+beden) + fason firma doluysa firma bazında
  const ayniKalem = (h: UretimHareket, beden?: string) =>
    h.siparisNo === seciliSiparis &&
    h.modelKod === seciliModel &&
    h.renkAd === seciliRenk &&
    (beden === undefined || h.beden === beden) &&
    (!cariKod || (h.cariKod ?? '') === cariKod)
  const gidenMiktar = (beden?: string) =>
    hareketler.filter((h) => ayniKalem(h, beden) && (h.yon ?? 'gidis') === 'gidis').reduce((s, h) => s + h.miktar, 0)
  const gelenMiktar = (beden?: string) =>
    hareketler.filter((h) => ayniKalem(h, beden) && h.yon === 'gelis').reduce((s, h) => s + h.miktar, 0)
  // Aynı anahtarlı satır var mı? (sipariş+model+renk+beden+işlem+yön+cari+kalite)
  const mukerrerVarMi = (beden: string, disaridaId: number | null) =>
    hareketler.some((h) =>
      (disaridaId === null || h.id !== disaridaId) &&
      h.siparisNo === seciliSiparis &&
      h.modelKod === seciliModel &&
      h.renkAd === (seciliRenk || '-') &&
      h.beden === beden &&
      h.islemKod === seciliIslem &&
      (h.yon ?? 'gidis') === yon &&
      (h.cariKod ?? '') === (cariKod || '') &&
      h.kalite === kalite
    )

  const barkodTara = useCallback(() => {
    if (!barkodInput.trim()) return
    const parsed = parseBarkod(barkodInput.trim())
    if (parsed) {
      setSeciliSiparis(parsed.siparisNo)
      setSeciliModel(parsed.modelKod)
      setSeciliRenk(parsed.renkAd)
      setSeciliBeden('')
      setBedenAdetler({})
      message.success(`Barkod okundu: ${parsed.siparisNo} / ${parsed.modelKod} — beden adetlerini girin`)
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
    if (!cariKod) {
      message.warning('Lütfen cari hesap seçin')
      return
    }
    const islem = defaultIslemler.find((i) => i.kod === seciliIslem)

    const topluGirisler = (seciliRenkData?.bedenler ?? [])
      .map((beden) => ({ beden, adet: bedenAdetler[beden] ?? 0 }))
      .filter((x) => x.adet > 0)

    if (duzenlenenId !== null) {
      if (topluGirisler.length !== 1) {
        message.warning('Düzenlemede tek beden adedi girin')
        return
      }
      const g = topluGirisler[0]
      if (yon === 'gidis' && mukerrerVarMi(g.beden, duzenlenenId)) {
        message.warning(`${g.beden} bedeni zaten girilmiş`)
        return
      }
      if (yon === 'gelis') {
        const eski = hareketler.find((h) => h.id === duzenlenenId)
        const kalan = gidenMiktar(g.beden) - gelenMiktar(g.beden) + (eski && eski.yon === 'gelis' && ayniKalem(eski, g.beden) ? eski.miktar : 0)
        if (g.adet > kalan) {
          message.warning(`${g.beden} bedeninde dışarıda bu kadar yok — kalan: ${kalan} adet`)
          return
        }
      }
      setHareketler((prev) =>
        prev.map((h) =>
          h.id === duzenlenenId
            ? {
                ...h,
                siparisNo: seciliSiparis,
                modelKod: seciliModel,
                modelAd: seciliModelData?.modelAd ?? h.modelAd,
                renkAd: seciliRenk || '-',
                beden: g.beden,
                islemKod: seciliIslem,
                islemAd: islem?.ad ?? seciliIslem,
                yon,
                miktar: g.adet,
                kalite,
                birimFiyat,
                dovizCinsi,
                dovizKuru,
                cariKod: cariKod || null,
                cariAd: cariAd || null,
                tarih: tarih.format('YYYY-MM-DD'),
                aciklama,
              }
            : h,
        ),
      )
      message.success('Hareket güncellendi')
    } else {
      if (topluGirisler.length === 0) {
        message.warning('Lütfen beden adedi girin')
        return
      }
      if (yon === 'gidis') {
        for (const k of topluGirisler) {
          if (mukerrerVarMi(k.beden, null)) {
            message.warning(`${k.beden} bedeni zaten girilmiş`)
            return
          }
        }
      }
      if (yon === 'gelis') {
        for (const k of topluGirisler) {
          const kalan = gidenMiktar(k.beden) - gelenMiktar(k.beden)
          if (k.adet > kalan) {
            message.warning(`${k.beden} bedeninde dışarıda bu kadar yok — kalan: ${kalan} adet`)
            return
          }
        }
      }
      const tarihStr = tarih.format('YYYY-MM-DD')
      const barkod = generateBarkod(seciliSiparis, seciliModel, seciliRenk)
      const simdi = Date.now()
      const yeniHareketler: UretimHareket[] = topluGirisler.map((g, i) => ({
        id: simdi + i,
        siparisNo: seciliSiparis,
        modelKod: seciliModel,
        modelAd: seciliModelData?.modelAd ?? '',
        renkAd: seciliRenk || '-',
        beden: g.beden,
        islemKod: seciliIslem,
        islemAd: islem?.ad ?? seciliIslem,
        yon,
        miktar: g.adet,
        kalite,
        birimFiyat,
        dovizCinsi,
        dovizKuru,
        cariKod: cariKod || null,
        cariAd: cariAd || null,
        tarih: tarihStr,
        aciklama,
        barkod,
        kayitYapan: 'Kullanıcı',
      }))
      setHareketler((prev) => [...yeniHareketler, ...prev])
      message.success(`${yeniHareketler.length} beden kaydedildi`)
    }
    temizle()
  }

  const temizle = () => {
    setSeciliIslem('')
    setSeciliBeden('')
    setKalite('Sağlam')
    setBirimFiyat(null)
    setCariKod('')
    setCariAd('')
    setAciklama('')
    setDovizCinsi('TL')
    setDovizKuru(1)
    setBedenAdetler({})
    setTarih(dayjs())
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
    { title: 'Yön', dataIndex: 'yon', width: 70, align: 'center', render: (v: UretimHareket['yon']) => (
      <Tag color={v === 'gelis' ? 'green' : 'blue'}>{v === 'gelis' ? 'Gelen' : 'Giden'}</Tag>
    )},
    { title: 'Miktar', dataIndex: 'miktar', width: 70, align: 'right' },
    {
      title: 'Kalite',
      width: 80,
      align: 'center',
      render: (_: unknown, r: UretimHareket) => (
        <Tag color={
          r.kalite === 'Sağlam' ? 'green' :
          r.kalite === '2. Kalite' ? 'orange' :
          r.kalite === 'Defolu' ? 'red' : 'blue'
        }>
          {r.kalite}
        </Tag>
      ),
    },
    { title: 'Birim Fiyat', dataIndex: 'birimFiyat', width: 90, align: 'right', render: (v: number | null, r: UretimHareket) => {
      if (v == null) return '-'
      const doviz = r.dovizCinsi && r.dovizCinsi !== 'TL' ? ` ${r.dovizCinsi}` : ' ₺'
      return `${v.toFixed(2)}${doviz}`
    }},
    { title: 'Kur', dataIndex: 'dovizKuru', width: 70, align: 'right', render: (v: number | null, r: UretimHareket) => {
      if (r.dovizCinsi === 'TL') return '1.0000'
      if (!v) return '-'
      return v.toFixed(4)
    }},
    { title: 'Satır Tutarı', key: 'satirTutari', width: 110, align: 'right', render: (_: unknown, r: UretimHareket) => {
      if (r.birimFiyat == null) return '-'
      const tutar = r.miktar * r.birimFiyat * (r.dovizKuru ?? 1)
      return `${tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`
    }},
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
          onClick={(e) => {
            e.stopPropagation()
            modal.confirm({
              title: 'Satır silinsin mi?',
              content: `${r.siparisNo} / ${r.modelKod} / ${r.renkAd} / ${r.beden} — ${r.miktar} adet`,
              okText: 'Sil',
              cancelText: 'Vazgeç',
              okType: 'danger',
              onOk: () => {
                setHareketler((prev) => prev.filter((h) => h.id !== r.id))
                if (duzenlenenId === r.id) temizle()
              },
            })
          }}
        />
      ),
    },
  ]

  return (
    <div className="!p-3 flex flex-col gap-2 h-full">
      {/* Yön Seçimi */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          size="large"
          type={yon === 'gidis' ? 'primary' : 'default'}
          icon={<ArrowUpOutlined />}
          onClick={() => setYon('gidis')}
          className={yon === 'gidis'
            ? '!h-[42px] !text-[14px] !font-bold'
            : '!h-[42px] !text-[14px] !font-medium !text-gray-400'}
        >
          Giden
        </Button>
        <Button
          size="large"
          type={yon === 'gelis' ? 'primary' : 'default'}
          icon={<ArrowDownOutlined />}
          onClick={() => setYon('gelis')}
          className={yon === 'gelis'
            ? '!h-[42px] !text-[14px] !font-bold !bg-green-600 !border-green-600 hover:!bg-green-500 hover:!border-green-500'
            : '!h-[42px] !text-[14px] !font-medium !text-gray-400'}
        >
          Gelen
        </Button>
      </div>

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
        <Card size="small" className="!mb-0" title={
          <span className="text-[11px] text-gray-500 flex items-center gap-2">
            Sipariş Bilgileri
            {seciliBeden && (
              <span className="text-[12px] text-blue-500 font-semibold">Aktif Beden: {seciliBeden}</span>
            )}
          </span>
        }>
          <div className="flex gap-3">
            {/* Input Alanları */}
            <div className="space-y-1.5 w-[50%]">
              <div>
                <div className="text-[9px] text-black mb-0 font-medium">Tarih</div>
                <DatePicker
                  className="!w-[70%]"
                  size="small"
                  format="DD.MM.YYYY"
                  value={tarih}
                  onChange={(v) => v && setTarih(v)}
                  allowClear={false}
                />
              </div>
              <div>
                <div className="text-[9px] text-black mb-0 font-medium">Sipariş</div>
                <Select
                  className="!w-[70%]"
                  size="small"
                  placeholder="Sipariş seçin"
                  value={seciliSiparis || undefined}
                  onChange={(v) => {
                    setSeciliSiparis(v)
                    setSeciliModel('')
                    setSeciliRenk('')
                    setSeciliBeden('')
                    setBedenAdetler({})
                  }}
                  options={mockSiparisler.map((s) => ({ label: s.siparisNo, value: s.siparisNo }))}
                />
              </div>
              <div>
                <div className="text-[9px] text-black mb-0 font-medium">Model</div>
                <Select
                  className="!w-[70%]"
                  size="small"
                  placeholder="Model seçin"
                  value={seciliModel || undefined}
                  onChange={(v) => {
                    setSeciliModel(v)
                    setSeciliRenk('')
                    setSeciliBeden('')
                    setBedenAdetler({})
                  }}
                  disabled={!seciliSiparis}
                  options={seciliSiparisData?.modeller.map((m) => ({ label: `${m.modelKod} - ${m.modelAd}`, value: m.modelKod })) ?? []}
                />
              </div>
              <div>
                <div className="text-[9px] text-black mb-0 font-medium">Renk</div>
                <Select
                  className="!w-[70%]"
                  size="small"
                  placeholder="Renk"
                  value={seciliRenk || undefined}
                  onChange={(v) => {
                    setSeciliRenk(v)
                    setSeciliBeden('')
                    setBedenAdetler({})
                  }}
                  allowClear
                  disabled={!seciliModel}
                  options={seciliModelData?.renkler.map((r) => ({ label: r.renkAd, value: r.renkAd })) ?? []}
                />
              </div>
              <div>
                <div className="text-[9px] text-black mb-0 font-medium">Cari Hesap</div>
                <SearchableCariSelect
                  value={cariKod || undefined}
                  onChange={(kod, record) => {
                    setCariKod(kod ?? '')
                    setCariAd(record?.ad ?? '')
                  }}
                  placeholder="Cari seçin"
                  className="!w-full"
                  widthClass="!w-[70%]"
                  hideAdLabel
                />
                {cariAd && (
                  <div className="text-[10px] text-gray-600 truncate !w-[70%] mt-0.5" title={cariAd}>
                    {cariAd}
                  </div>
                )}
              </div>
            </div>

            {/* Ürün Görseli */}
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-gray-200 rounded bg-gray-50 overflow-hidden self-stretch">
              {seciliModel ? (
                <img
                  src="https://picsum.photos/150/150"
                  alt={seciliModel}
                  className="w-[150px] h-[150px] object-cover rounded"
                />
              ) : (
                <div className="text-[8px] text-gray-400 text-center px-1">Görsel</div>
              )}
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

        {/* Sağ Kolon: Adet, Kalite, Fiyat */}
        <Card size="small" className="!mb-0" title={<span className="text-[10px] text-gray-500">Adet & Kalite</span>}>
          <div className="space-y-2">
            {seciliRenkData && (
              <div>
                <div className="text-[9px] text-gray-400 mb-1 uppercase">Beden Adetleri</div>
                <div className="grid grid-cols-4 gap-1.5">
                  {seciliRenkData.bedenler.map((beden) => (
                    <div key={beden} className="flex flex-col items-center border border-gray-200 rounded px-1 py-1 bg-white">
                      <span className="text-[10px] font-bold text-gray-700">{beden}</span>
                      <InputNumber
                        size="small"
                        min={0}
                        precision={0}
                        decimalSeparator=","
                        placeholder="0"
                        value={bedenAdetler[beden] ?? null}
                        onChange={(v) => setBedenAdetler((p) => ({ ...p, [beden]: v }))}
                        className="!w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-4 gap-2">
              <div>
                <div className="text-[9px] text-gray-400 mb-0.5 uppercase">Birim Fiyat</div>
                <InputNumber
                  className="!w-full"
                  size="small"
                  min={0}
                  precision={2}
                  decimalSeparator=","
                  value={birimFiyat}
                  onChange={setBirimFiyat}
                />
              </div>
              <div>
                <div className="text-[9px] text-gray-400 mb-0.5 uppercase">Döviz</div>
                <Select
                  className="!w-full"
                  size="small"
                  value={dovizCinsi}
                  onChange={setDovizCinsi}
                  options={[
                    { label: 'TL', value: 'TL' },
                    ...efektikKurlar
                      .filter((k) => k.dovizKodu !== 'TL')
                      .map((k) => ({ label: k.dovizKodu, value: k.dovizKodu })),
                  ]}
                />
              </div>
              <div>
                <div className="text-[9px] text-gray-400 mb-0.5 uppercase">Döviz Kuru</div>
                <InputNumber
                  className="!w-full"
                  size="small"
                  min={0}
                  precision={4}
                  decimalSeparator=","
                  value={dovizKuru}
                  onChange={setDovizKuru}
                  disabled={dovizCinsi === 'TL'}
                />
              </div>
              <div>
                <div className="text-[9px] text-gray-400 mb-0.5 uppercase">Açıklama</div>
                <Input
                  size="small"
                  placeholder="Opsiyonel"
                  value={aciklama}
                  onChange={(e) => setAciklama(e.target.value)}
                />
              </div>
            </div>
            <div>
              <div className="text-[9px] text-gray-400 mb-1 uppercase">Kalite</div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { value: 'Sağlam', active: 'border-green-500 bg-green-50 text-green-600', icon: '✓' },
                  { value: '2. Kalite', active: 'border-orange-500 bg-orange-50 text-orange-600', icon: '2' },
                  { value: 'Defolu', active: 'border-red-500 bg-red-50 text-red-600', icon: '✗' },
                  { value: 'Diğer', active: 'border-blue-500 bg-blue-50 text-blue-600', icon: '?' },
                ].map((k) => (
                  <div
                    key={k.value}
                    onClick={() => setKalite(k.value)}
                    className={`
                      flex items-center justify-center gap-1.5 py-2 rounded cursor-pointer border transition-all
                      ${kalite === k.value
                        ? k.active
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className={`text-[14px] ${kalite === k.value ? '' : 'opacity-40'}`}>{k.icon}</span>
                    <span className="text-[10px] font-medium">{k.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              {duzenlenenId !== null && (
                <Button size="small" onClick={temizle} className="flex-1">
                  Vazgeç
                </Button>
              )}
              <Button type="primary" size="small" onClick={kaydet} className={duzenlenenId !== null ? 'flex-[2]' : '!w-full'} disabled={!seciliIslem}>
                {duzenlenenId !== null
                  ? 'Güncelle'
                  : (() => {
                      const n = (seciliRenkData?.bedenler ?? []).filter((b) => (bedenAdetler[b] ?? 0) > 0).length
                      return n > 0 ? `Kaydet (${n} beden)` : 'Kaydet'
                    })()}
              </Button>
            </div>
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
          summary={(data) => {
            const toplamAdet = data.reduce((s, r) => s + r.miktar, 0)
            const toplamTutar = data.reduce((s, r) => s + (r.birimFiyat != null ? r.miktar * r.birimFiyat * (r.dovizKuru ?? 1) : 0), 0)
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}><span className="text-[11px] font-bold">Toplam ({data.length})</span></Table.Summary.Cell>
                {[1, 2, 3, 4, 5, 6].map((i) => <Table.Summary.Cell key={i} index={i} />)}
                <Table.Summary.Cell index={7}><span className="text-[11px] font-bold">{toplamAdet}</span></Table.Summary.Cell>
                {[8, 9, 10].map((i) => <Table.Summary.Cell key={i} index={i} />)}
                <Table.Summary.Cell index={11}><span className="text-[11px] font-bold">{toplamTutar.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span></Table.Summary.Cell>
                {[12, 13, 14].map((i) => <Table.Summary.Cell key={i} index={i} />)}
              </Table.Summary.Row>
            )
          }}
          rowClassName={(record) => record.id === duzenlenenId ? 'bg-blue-50 cursor-pointer' : 'cursor-pointer'}
          onRow={(record) => ({
            onClick: () => {
              setDuzenlenenId(record.id)
              setSeciliSiparis(record.siparisNo)
              setSeciliModel(record.modelKod)
              setSeciliRenk(record.renkAd === '-' ? '' : record.renkAd)
              setSeciliBeden(record.beden === '-' ? '' : record.beden)
              setSeciliIslem(record.islemKod)
              setYon(record.yon ?? 'gidis')
              setBedenAdetler(record.beden && record.beden !== '-' ? { [record.beden]: record.miktar } : {})
              setKalite(record.kalite)
              setTarih(dayjs(record.tarih))
              setBirimFiyat(record.birimFiyat)
              setDovizCinsi(record.dovizCinsi || 'TL')
              setDovizKuru(record.dovizKuru ?? 1)
              setCariKod(record.cariKod ?? '')
              setCariAd(record.cariAd ?? '')
              setAciklama(record.aciklama)
            },
          })}
        />
      </div>
    </div>
  )
}

function normalizeTr(s: string): string {
  return s.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
}

// Mock siparişlere karşı doğrular, kanonik (seçimle eşleşen) değerleri döner
function eslestirBarkod(siparisNo: string, modelKod: string, renkAd: string) {
  const s = mockSiparisler.find((x) => normalizeTr(x.siparisNo) === normalizeTr(siparisNo))
  const m = s?.modeller.find((x) => normalizeTr(x.modelKod) === normalizeTr(modelKod))
  const r = m?.renkler.find((x) => normalizeTr(x.renkAd) === normalizeTr(renkAd))
  return s && m && r ? { siparisNo: s.siparisNo, modelKod: m.modelKod, renkAd: r.renkAd } : null
}

function parseBarkod(barkod: string): { siparisNo: string; modelKod: string; renkAd: string } | null {
  const parts = barkod.split('-').map((p) => p.trim()).filter((p) => p.length > 0)
  if (parts.length < 3) return null

  // Yeni format: siparis-model-renk
  const yeni = eslestirBarkod(
    parts.slice(0, parts.length - 2).join('-'),
    parts[parts.length - 2],
    parts[parts.length - 1],
  )
  if (yeni) return yeni

  // Eski bedenli format: siparis-model-renk-beden (beden yoksayılır, adet gridinden girilir)
  if (parts.length >= 4) {
    const eski = eslestirBarkod(
      parts.slice(0, parts.length - 3).join('-'),
      parts[parts.length - 3],
      parts[parts.length - 2],
    )
    if (eski) return eski
  }

  // Eşleşme yoksa ham doldur (eski lenient davranış)
  return {
    siparisNo: parts.slice(0, parts.length - 2).join('-'),
    modelKod: parts[parts.length - 2],
    renkAd: parts[parts.length - 1],
  }
}

function generateBarkod(siparisNo: string, modelKod: string, renkAd: string): string {
  return `${siparisNo}-${modelKod}-${renkAd}`.replace(/\s+/g, '')
}
