'use client'

import { useState, useMemo } from 'react'
import { Button, Input, InputNumber, Select, DatePicker, Table, App, Tag, Card, Divider, Dropdown } from 'antd'
import type { ColumnsType, MenuProps } from 'antd/es/table'
import {
  ScissorOutlined,
  SearchOutlined,
  SendOutlined,
  EditOutlined,
  UndoOutlined,
  FireOutlined,
  ScanOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { iadeTalepApi } from '@/lib/iade-talep-api'
import { barkodApi, type BarkodEslesme } from '@/lib/barkod-api'

export interface KesimKartiRecord {
  id: number
  siparisNo: string
  modelKod: string
  modelAd: string
  renkAd: string
  beden: string
  planlananMiktar: number
  kesilenMiktar: number
  fireMiktar: number
  kumasAd: string
  kumasRenk: string
  gerekliMiktar: number
  brutMiktar: number
  kumasMiktar: number
  birimTuketim: number
  beklenenAdet: number
  kalanMT: number
  fireOrani: number
  iadeTalep: boolean
  tarih: string
  durum: 'KESILDI' | 'DIKIME_GONDERILDI'
}

const mockSiparisler = [
  {
    siparisNo: 'SIP-2026-001',
    modeller: [
      {
        modelKod: 'BT001',
        modelAd: 'Basic Tişört',
        kumasGruplari: [
          { kumasAd: 'Overlay Penye', renk: 'Beyaz', gerekliMT: 120, kesimFazlasi: 5 },
          { kumasAd: 'Overlay Penye', renk: 'Siyah', gerekliMT: 60, kesimFazlasi: 5 },
        ],
        renkler: [
          { renkAd: 'Beyaz', bedenler: [
            { beden: 'S', miktar: 200 },
            { beden: 'M', miktar: 400 },
            { beden: 'L', miktar: 400 },
            { beden: 'XL', miktar: 200 },
          ]},
          { renkAd: 'Siyah', bedenler: [
            { beden: 'S', miktar: 150 },
            { beden: 'M', miktar: 300 },
            { beden: 'L', miktar: 150 },
          ]},
        ],
      },
      {
        modelKod: 'VE002',
        modelAd: 'Viskon Elbise',
        kumasGruplari: [
          { kumasAd: 'Viskon Kumaş', renk: 'Kırmızı', gerekliMT: 80, kesimFazlasi: 3 },
        ],
        renkler: [
          { renkAd: 'Kırmızı', bedenler: [
            { beden: '36', miktar: 100 },
            { beden: '38', miktar: 150 },
            { beden: '40', miktar: 100 },
            { beden: '42', miktar: 50 },
          ]},
        ],
      },
    ],
  },
]

const mockKesimKartlari: KesimKartiRecord[] = [
  {
    id: 1, siparisNo: 'SIP-2026-001', modelKod: 'BT001', modelAd: 'Basic Tişört',
    renkAd: 'Beyaz', beden: 'M', planlananMiktar: 400, kesilenMiktar: 400, fireMiktar: 8,
    kumasAd: 'Overlay Penye', kumasRenk: 'Beyaz', gerekliMiktar: 40, brutMiktar: 42,
    kumasMiktar: 42, birimTuketim: 0.1, beklenenAdet: 420, kalanMT: 2, fireOrani: 4.8,
    iadeTalep: false, tarih: '2026-08-28', durum: 'KESILDI',
  },
  {
    id: 2, siparisNo: 'SIP-2026-001', modelKod: 'BT001', modelAd: 'Basic Tişört',
    renkAd: 'Beyaz', beden: 'L', planlananMiktar: 400, kesilenMiktar: 400, fireMiktar: 10,
    kumasAd: 'Overlay Penye', kumasRenk: 'Beyaz', gerekliMiktar: 40, brutMiktar: 42,
    kumasMiktar: 42, birimTuketim: 0.1, beklenenAdet: 420, kalanMT: 2, fireOrani: 4.8,
    iadeTalep: true, tarih: '2026-08-28', durum: 'DIKIME_GONDERILDI',
  },
]

export default function KesimKarti() {
  const { message } = App.useApp()
  const [kesimKartlari, setKesimKartlari] = useState<KesimKartiRecord[]>(mockKesimKartlari)
  const [barkodInput, setBarkodInput] = useState('')
  const [tarih, setTarih] = useState(dayjs())
  const [seciliSiparis, setSeciliSiparis] = useState<string>('')
  const [seciliModel, setSeciliModel] = useState<string>('')
  const [seciliRenk, setSeciliRenk] = useState<string>('')
  const [seciliBeden, setSeciliBeden] = useState<string>('')
  const [seciliKumas, setSeciliKumas] = useState<string>('')
  const [kumasMiktar, setKumasMiktar] = useState<number>(0)
  const [kesilenMiktar, setKesilenMiktar] = useState<number>(0)
  const [fireMiktar, setFireMiktar] = useState<number>(0)
  const [duzenlenenId, setDuzenlenenId] = useState<number | null>(null)

  const seciliSiparisData = mockSiparisler.find((s) => s.siparisNo === seciliSiparis)
  const seciliModelData = seciliSiparisData?.modeller.find((m) => m.modelKod === seciliModel)
  const seciliRenkData = seciliModelData?.renkler.find((r) => r.renkAd === seciliRenk)
  const seciliBedenData = seciliRenkData?.bedenler.find((b) => b.beden === seciliBeden)
  const seciliKumasGrubu = seciliModelData?.kumasGruplari.find((k) => `${k.kumasAd}-${k.renk}` === seciliKumas)

  const toplamPlanlanan = seciliBedenData?.miktar ?? 0
  const gerekliMT = seciliKumasGrubu?.gerekliMT ?? 0
  const kesimFazlasi = seciliKumasGrubu?.kesimFazlasi ?? 0
  const brutMT = gerekliMT * (1 + kesimFazlasi / 100)

  const toplamRenkAdet = seciliModelData
    ? seciliModelData.renkler.reduce((acc, r) => acc + r.bedenler.reduce((a, b) => a + (b.miktar ?? 0), 0), 0)
    : 0
  const birimTuketim = toplamRenkAdet > 0 ? gerekliMT / toplamRenkAdet : 0
  const beklenenAdet = birimTuketim > 0 ? Math.floor(kumasMiktar / birimTuketim) : 0
  const kullanilanMT = kesilenMiktar * birimTuketim
  const kalanMT = kumasMiktar - kullanilanMT
  const fireOrani = kumasMiktar > 0 ? (kalanMT / kumasMiktar) * 100 : 0

  const barkodTara = async () => {
    if (!barkodInput.trim()) return
    try {
      const eslesme = await barkodApi.tar(barkodInput.trim())
      setSeciliSiparis(eslesme.siparisNo)
      setSeciliModel(eslesme.modelKod)
      setSeciliRenk(eslesme.renkKod)
      setSeciliBeden(eslesme.beden)
      setSeciliKumas(`${eslesme.kumasAd}-${eslesme.kumasRenkAd || eslesme.kumasRenkKod}`)
      setKumasMiktar(0)
      setKesilenMiktar(0)
      setFireMiktar(0)
      message.success(`Barkod okundu: ${eslesme.siparisNo} / ${eslesme.modelKod}`)
    } catch {
      message.error('Barkod ile eşleşen kayıt bulunamadı')
    }
    setBarkodInput('')
  }

  const temizle = () => {
    setBarkodInput('')
    setTarih(dayjs())
    setSeciliSiparis('')
    setSeciliModel('')
    setSeciliRenk('')
    setSeciliBeden('')
    setSeciliKumas('')
    setKumasMiktar(0)
    setKesilenMiktar(0)
    setFireMiktar(0)
    setDuzenlenenId(null)
  }

  const kaydet = () => {
    if (!seciliSiparis || !seciliModel || !seciliRenk || !seciliBeden) {
      message.warning('Lütfen sipariş, model, renk ve beden seçin')
      return
    }
    if (kumasMiktar <= 0) {
      message.warning('Verilen kumaş miktarı 0\'dan büyük olmalı')
      return
    }
    if (kesilenMiktar <= 0) {
      message.warning('Kesilen miktar 0\'dan büyük olmalı')
      return
    }

    const yeniKart: KesimKartiRecord = {
      id: duzenlenenId ?? Date.now(),
      siparisNo: seciliSiparis,
      modelKod: seciliModel,
      modelAd: seciliModelData?.modelAd ?? '',
      renkAd: seciliRenk,
      beden: seciliBeden,
      planlananMiktar: toplamPlanlanan,
      kesilenMiktar,
      fireMiktar,
      kumasAd: seciliKumasGrubu?.kumasAd ?? '',
      kumasRenk: seciliKumasGrubu?.renk ?? '',
      gerekliMiktar: gerekliMT,
      brutMiktar: brutMT,
      kumasMiktar,
      birimTuketim,
      beklenenAdet,
      kalanMT,
      fireOrani,
      iadeTalep: duzenlenenId !== null ? (kesimKartlari.find((k) => k.id === duzenlenenId)?.iadeTalep ?? false) : false,
      tarih: tarih.format('YYYY-MM-DD'),
      durum: 'KESILDI',
    }

    if (duzenlenenId !== null) {
      setKesimKartlari((prev) => prev.map((k) => (k.id === duzenlenenId ? yeniKart : k)))
      message.success('Kesim kartı güncellendi')
    } else {
      setKesimKartlari((prev) => [yeniKart, ...prev])
      message.success('Kesim kartı oluşturuldu')
    }
    temizle()
  }

  const dikimeGonder = (id: number) => {
    setKesimKartlari((prev) =>
      prev.map((k) => (k.id === id ? { ...k, durum: 'DIKIME_GONDERILDI' } : k)),
    )
    message.success('Dikime gönderildi')
  }

  const iadeTalepOlustur = async (id: number) => {
    const kart = kesimKartlari.find((k) => k.id === id)
    if (!kart) return

    try {
      await iadeTalepApi.create({
        siparisNo: kart.siparisNo,
        modelKod: kart.modelKod,
        modelAd: kart.modelAd,
        renkAd: kart.renkAd,
        beden: kart.beden,
        kumasAd: kart.kumasAd,
        kumasRenk: kart.kumasRenk,
        kalanMT: kart.kalanMT,
      })
      setKesimKartlari((prev) =>
        prev.map((k) => (k.id === id ? { ...k, iadeTalep: true } : k)),
      )
      message.success('İade talebi oluşturuldu')
    } catch {
      message.error('İade talebi oluşturulurken hata oluştu')
    }
  }

  const fireOlarakKaydet = (id: number) => {
    setKesimKartlari((prev) =>
      prev.map((k) => {
        if (k.id !== id) return k
        const yeniFireMiktar = k.fireMiktar + k.kalanMT
        const yeniKalanMT = 0
        const yeniFireOrani = k.kumasMiktar > 0
          ? (yeniFireMiktar / k.kumasMiktar) * 100
          : 0
        return {
          ...k,
          fireMiktar: yeniFireMiktar,
          kalanMT: yeniKalanMT,
          fireOrani: yeniFireOrani,
        }
      }),
    )
    message.info('Kalan kumaş fire olarak kaydedildi')
  }

  const ozet = useMemo(() => {
    return kesimKartlari.reduce(
      (acc, k) => ({
        toplamMT: acc.toplamMT + k.kumasMiktar,
        toplamKesilen: acc.toplamKesilen + k.kesilenMiktar,
        toplamKalan: acc.toplamKalan + k.kalanMT,
        toplamFire: acc.toplamFire + k.fireMiktar,
        toplamAdet: acc.toplamAdet + 1,
      }),
      { toplamMT: 0, toplamKesilen: 0, toplamKalan: 0, toplamFire: 0, toplamAdet: 0 },
    )
  }, [kesimKartlari])

  const columns: ColumnsType<KesimKartiRecord> = [
    { title: 'Tarih', dataIndex: 'tarih', width: 90, render: (v: string) => new Date(v).toLocaleDateString('tr-TR') },
    { title: 'Sipariş', dataIndex: 'siparisNo', width: 120 },
    { title: 'Model', dataIndex: 'modelKod', width: 70 },
    { title: 'Renk', dataIndex: 'renkAd', width: 70 },
    { title: 'Beden', dataIndex: 'beden', width: 50 },
    { title: 'Verilen MT', dataIndex: 'kumasMiktar', width: 80, align: 'right', render: (v: number) => `${v} MT` },
    { title: 'Beklenen', dataIndex: 'beklenenAdet', width: 70, align: 'right' },
    { title: 'Kesilen', dataIndex: 'kesilenMiktar', width: 70, align: 'right' },
    { title: 'Kalan MT', dataIndex: 'kalanMT', width: 75, align: 'right', render: (v: number) => <span className={v > 0 ? 'text-orange-500 font-medium' : ''}>{v.toFixed(1)}</span> },
    { title: 'Fire %', dataIndex: 'fireOrani', width: 60, align: 'right', render: (v: number) => <span className={v > 10 ? 'text-red-500 font-medium' : 'text-gray-500'}>%{v.toFixed(1)}</span> },
    {
      title: 'Durum',
      dataIndex: 'durum',
      width: 100,
      align: 'center',
      render: (v: string, r: KesimKartiRecord) => (
        <div className="flex flex-col items-center gap-0.5">
          <Tag color={v === 'KESILDI' ? 'blue' : 'green'} className="!text-[9px] !m-0">
            {v === 'KESILDI' ? 'Kesildi' : 'Dikime Gönderildi'}
          </Tag>
          {r.iadeTalep && <Tag color="orange" className="!text-[9px] !m-0">İade Talep</Tag>}
        </div>
      ),
    },
    {
      title: '',
      width: 30,
      align: 'center',
      render: (_: unknown, record: KesimKartiRecord) => {
        const menuItems: MenuProps['items'] = [
          {
            key: 'duzenle',
            label: 'Düzenle',
            icon: <EditOutlined />,
            onClick: () => {
              setDuzenlenenId(record.id)
              setSeciliSiparis(record.siparisNo)
              setSeciliModel(record.modelKod)
              setSeciliRenk(record.renkAd)
              setSeciliBeden(record.beden)
              setSeciliKumas(`${record.kumasAd}-${record.kumasRenk}`)
              setKumasMiktar(record.kumasMiktar)
              setKesilenMiktar(record.kesilenMiktar)
              setFireMiktar(record.fireMiktar)
              setTarih(dayjs(record.tarih))
            },
          },
          ...(record.durum === 'KESILDI'
            ? [{
                key: 'dikim',
                label: 'Dikime Gönder',
                icon: <SendOutlined />,
                onClick: () => dikimeGonder(record.id),
              }]
            : []),
          ...(!record.iadeTalep && record.kalanMT > 0
            ? [{
                key: 'iade',
                label: 'İade Oluştur',
                icon: <UndoOutlined />,
                onClick: () => iadeTalepOlustur(record.id),
              }]
            : []),
          ...(record.kalanMT > 0
            ? [{
                key: 'fire',
                label: 'Fire Olarak Kaydet',
                icon: <FireOutlined />,
                onClick: () => fireOlarakKaydet(record.id),
              }]
            : []),
        ]

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button type="text" size="small" icon={<EditOutlined />} />
          </Dropdown>
        )
      },
    },
  ]

  return (
    <div className="!p-3 flex flex-col gap-2 h-full">
      {/* Başlık */}
      <div className="flex items-center gap-2">
        <ScissorOutlined className="text-[16px] text-blue-500" />
        <span className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider">
          Kesim Kartı
        </span>
      </div>

      {/* 2 Kolonlu Yapı */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Sol: Sipariş & Kumaş */}
        <Card size="small" className="!mb-0" title={<span className="text-[10px] text-gray-500">Sipariş & Kumaş</span>}>
          {/* Barkod */}
          <div className="flex gap-2 mb-2">
            <Input
              size="small"
              placeholder="Barkod okutun: SIPARIS|#|KOD"
              value={barkodInput}
              onChange={(e) => setBarkodInput(e.target.value)}
              onPressEnter={barkodTara}
              prefix={<ScanOutlined className="text-gray-400" />}
            />
            <Button size="small" onClick={barkodTara} icon={<ScanOutlined />}>Tara</Button>
          </div>

          <Divider className="!my-2" />

          <div className="space-y-2">
            <div>
              <div className="text-[9px] text-gray-400 mb-0.5 uppercase">Tarih</div>
              <DatePicker
                className="!w-full"
                size="small"
                value={tarih}
                onChange={(v) => setTarih(v ?? dayjs())}
                format="DD.MM.YYYY"
              />
            </div>
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
                  setSeciliKumas('')
                  setKumasMiktar(0)
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
                  setSeciliKumas('')
                  setKumasMiktar(0)
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
                    setSeciliKumas('')
                    setKumasMiktar(0)
                  }}
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
                  disabled={!seciliRenk}
                  options={seciliRenkData?.bedenler.map((b) => ({ label: `${b.beden} (${b.miktar} adet)`, value: b.beden })) ?? []}
                />
              </div>
            </div>

            {/* Kumaş Seçimi */}
            {seciliRenk && seciliModelData?.kumasGruplari && seciliModelData.kumasGruplari.length > 0 && (
              <>
                <Divider className="!my-1" />
                <div>
                  <div className="text-[9px] text-gray-400 mb-0.5 uppercase">Kumaş</div>
                  <Select
                    className="!w-full"
                    size="small"
                    placeholder="Kumaş seçin"
                    value={seciliKumas || undefined}
                    onChange={(v) => {
                      setSeciliKumas(v)
                      setKumasMiktar(0)
                      setKesilenMiktar(0)
                    }}
                    options={seciliModelData.kumasGruplari.map((k) => ({
                      label: `${k.kumasAd} (${k.renk}) - ${k.gerekliMT} MT`,
                      value: `${k.kumasAd}-${k.renk}`,
                    }))}
                  />
                </div>
                {birimTuketim > 0 && (
                  <div className="bg-blue-50 rounded p-1.5 text-[10px] text-blue-600">
                    Birim Tüketim: <span className="font-semibold">{birimTuketim.toFixed(4)} MT/ADET</span>
                  </div>
                )}
              </>
            )}

            {/* Verilen Kumaş */}
            {seciliKumas && (
              <div>
                <div className="text-[9px] text-gray-400 mb-0.5 uppercase">Verilen Kumaş (MT) *</div>
                <InputNumber
                  className="!w-full"
                  size="small"
                  min={0}
                  step={0.5}
                  precision={1}
                  value={kumasMiktar || undefined}
                  onChange={(v) => setKumasMiktar(v ?? 0)}
                  placeholder="Örn: 42"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Sağ: Kesim Bilgileri & Hesaplama */}
        <Card size="small" className="!mb-0" title={<span className="text-[10px] text-gray-500">Kesim & Hesaplama</span>}>
          <div className="space-y-2">
            {/* Hesaplama Özeti */}
            {kumasMiktar > 0 && birimTuketim > 0 && (
              <div className="bg-gray-50 rounded p-2 space-y-1">
                <div className="text-[11px] flex justify-between">
                  <span className="text-gray-500">Verilen:</span>
                  <span className="font-medium">{kumasMiktar} MT</span>
                </div>
                <div className="text-[11px] flex justify-between">
                  <span className="text-gray-500">Birim Tüketim:</span>
                  <span className="font-medium">{birimTuketim.toFixed(4)} MT/ADET</span>
                </div>
                <div className="text-[11px] flex justify-between">
                  <span className="text-gray-500">Beklenen Adet:</span>
                  <span className="font-semibold text-blue-600">{beklenenAdet} adet</span>
                </div>
                <Divider className="!my-1" />
                <div className="text-[11px] flex justify-between">
                  <span className="text-gray-500">Kullanılan:</span>
                  <span>{kullanilanMT.toFixed(1)} MT</span>
                </div>
                <div className="text-[11px] flex justify-between">
                  <span className="text-gray-500">Kalan:</span>
                  <span className={kalanMT > 0 ? 'font-semibold text-orange-500' : 'font-medium text-green-500'}>
                    {kalanMT.toFixed(1)} MT
                  </span>
                </div>
                <div className="text-[11px] flex justify-between">
                  <span className="text-gray-500">Fire Oranı:</span>
                  <span className={fireOrani > 10 ? 'font-semibold text-red-500' : 'font-medium'}>
                    %{fireOrani.toFixed(1)}
                  </span>
                </div>
              </div>
            )}

            <div>
              <div className="text-[9px] text-gray-400 mb-0.5 uppercase">Planlanan Miktar</div>
              <InputNumber
                className="!w-full"
                size="small"
                value={toplamPlanlanan}
                disabled
              />
            </div>
            <div>
              <div className="text-[9px] text-gray-400 mb-0.5 uppercase">Beklenen Adet</div>
              <InputNumber
                className="!w-full"
                size="small"
                value={beklenenAdet}
                disabled
              />
            </div>
            <div>
              <div className="text-[9px] text-gray-400 mb-0.5 uppercase">Kesilen Miktar *</div>
              <InputNumber
                className="!w-full"
                size="small"
                min={0}
                value={kesilenMiktar || undefined}
                onChange={(v) => setKesilenMiktar(v ?? 0)}
              />
            </div>
            <div>
              <div className="text-[9px] text-gray-400 mb-0.5 uppercase">Fire Miktarı</div>
              <InputNumber
                className="!w-full"
                size="small"
                min={0}
                value={fireMiktar || undefined}
                onChange={(v) => setFireMiktar(v ?? 0)}
              />
            </div>

            <Divider className="!my-1" />

            <div className="space-y-1.5">
              <Button type="primary" size="small" onClick={kaydet} className="!w-full">
                {duzenlenenId !== null ? 'Güncelle' : 'Kesim Kaydet'}
              </Button>
              <Button size="small" onClick={temizle} className="!w-full">
                Temizle
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Genel Özet */}
      <div className="flex gap-3 text-[10px]">
        <div className="bg-white rounded px-3 py-1.5 border border-gray-200">
          <span className="text-gray-400">Toplam Verilen:</span>{' '}
          <span className="font-semibold">{ozet.toplamMT.toFixed(1)} MT</span>
        </div>
        <div className="bg-white rounded px-3 py-1.5 border border-gray-200">
          <span className="text-gray-400">Toplam Kesilen:</span>{' '}
          <span className="font-semibold">{ozet.toplamKesilen.toLocaleString('tr-TR')}</span>
        </div>
        <div className="bg-white rounded px-3 py-1.5 border border-gray-200">
          <span className="text-gray-400">Toplam Kalan:</span>{' '}
          <span className="font-semibold text-orange-500">{ozet.toplamKalan.toFixed(1)} MT</span>
        </div>
        <div className="bg-white rounded px-3 py-1.5 border border-gray-200">
          <span className="text-gray-400">Toplam Fire:</span>{' '}
          <span className="font-semibold text-red-500">{ozet.toplamFire}</span>
        </div>
      </div>

      {/* Kesim Kartları Tablosu */}
      <div className="flex-1 overflow-hidden">
        <Table<KesimKartiRecord>
          size="small"
          columns={columns}
          dataSource={kesimKartlari}
          rowKey="id"
          pagination={{ pageSize: 15, size: 'small', showSizeChanger: false }}
          scroll={{ y: 'calc(100vh - 420px)' }}
          locale={{ emptyText: 'Henüz kesim kartı oluşturulmadı' }}
          rowClassName={(record) => record.id === duzenlenenId ? 'bg-blue-50 cursor-pointer' : 'cursor-pointer'}
        />
      </div>
    </div>
  )
}
