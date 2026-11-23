'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Input, Select, DatePicker, Button, AutoComplete, App, Spin, Popconfirm } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import type { ColDef } from 'ag-grid-community'
import CardToolbar, { createToolbarButtons } from '@/components/shared/CardToolbar'
import DataGrid from '@/components/shared/DataGrid'
import SearchableCariSelect from '@/components/shared/SearchableCariSelect'
import { useKirli } from '@/lib/kirli'
import {
  cariHesapFisApi,
  type CariHesapFis,
  type CariHesapFisFormData,
} from '@/lib/cari-hesap-fis-api'
import { dovizApi, type Doviz } from '@/lib/doviz-api'
import { fisTipiEtiketi } from '@/data/cari-hesap-fis-tipleri'

const { TextArea } = Input

const formatTR = (v: number) =>
  new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0)

const parseTR = (s: string) => parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0

const yuvarla = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100

let satirSayaci = 0
const yeniSatirKey = () => `s-${Date.now()}-${++satirSayaci}`

const saatNormalize = (s: string) => {
  const t = (s || '').trim()
  if (!t) return '00:00:00'
  if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`
  if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t
  return '00:00:00'
}

function TurkishNumberInput({
  value,
  onChange,
  className,
}: {
  value: number
  onChange: (v: number) => void
  className?: string
}) {
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState('')
  const display = focused ? draft : formatTR(value)

  return (
    <Input
      size="small"
      value={display}
      onFocus={() => {
        setFocused(true)
        setDraft(value === 0 ? '' : String(value).replace('.', ','))
      }}
      onBlur={() => {
        setFocused(false)
        onChange(parseTR(draft))
      }}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          onChange(parseTR(draft))
          setFocused(false)
        }
      }}
      className={className}
    />
  )
}

interface FisSatir {
  key: string
  cariHesapId: number
  cariKod: string
  cariAd: string
  ozelKod: string
  hesapKodu: string
  hesapAdi: string
  aciklama: string
  vadeTarihi: Dayjs | null
  belgeNo: string
  borc: number
  alacak: number
  doviz: string
  dovizKuru: number
  borcYerel: number
  alacakYerel: number
  belgeTuru: string | null
  belgeId: number | null
  kontrol: string
}

interface CariHesapFisKartiProps {
  id?: number
  fisTipi?: string
  onKirliChange?: (kirli: boolean) => void
}

const bosSatir = (doviz: string, kur: number): FisSatir => ({
  key: yeniSatirKey(),
  cariHesapId: 0,
  cariKod: '',
  cariAd: '',
  ozelKod: '',
  hesapKodu: '',
  hesapAdi: '',
  aciklama: '',
  vadeTarihi: null,
  belgeNo: '',
  borc: 0,
  alacak: 0,
  doviz,
  dovizKuru: kur,
  borcYerel: 0,
  alacakYerel: 0,
  belgeTuru: null,
  belgeId: null,
  kontrol: '',
})

export default function CariHesapFisKarti({ id: propId, fisTipi: propFisTipi, onKirliChange }: CariHesapFisKartiProps) {
  const { message, modal } = App.useApp()
  const [id, setId] = useState<number | null>(propId ?? null)
  const [fisTipi, setFisTipi] = useState(propFisTipi ?? '')
  const [fisNo, setFisNo] = useState<number | null>(null)
  const [fisTarihi, setFisTarihi] = useState<Dayjs>(dayjs())
  const [saat, setSaat] = useState('00:00:00')
  const [belgeNo, setBelgeNo] = useState('')
  const [k, setK] = useState('')
  const [erisimKodu, setErisimKodu] = useState('')
  const [ozelKod, setOzelKod] = useState('')
  const [dovizCinsi, setDovizCinsi] = useState('TRY')
  const [dovizKuru, setDovizKuru] = useState<number | null>(1)
  const [kurTarihi, setKurTarihi] = useState<string | null>(null)
  const [masrafYeri, setMasrafYeri] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [satirlar, setSatirlar] = useState<FisSatir[]>(() => [bosSatir('TRY', 1)])
  const [dovizler, setDovizler] = useState<Doviz[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const { kirli, temizle } = useKirli([
    fisTipi, fisTarihi, saat, belgeNo, k, erisimKodu, ozelKod,
    dovizCinsi, dovizKuru, masrafYeri, aciklama, satirlar,
  ])
  useEffect(() => { onKirliChange?.(kirli) }, [kirli, onKirliChange])

  useEffect(() => {
    dovizApi
      .list()
      .then((list) => setDovizler(list.filter((d) => d.kullanimda)))
      .catch(() => setDovizler([]))
  }, [])

  const dovizSecenekleri = useMemo(() => {
    const opts = dovizler.map((d) => ({ value: d.kod, label: `${d.kod} - ${d.ad}` }))
    if (!opts.some((o) => o.value === 'TRY')) opts.unshift({ value: 'TRY', label: 'TRY - Türk Lirası' })
    return opts
  }, [dovizler])

  const satirlaraKurUygula = useCallback((doviz: string, kur: number) => {
    setSatirlar((prev) =>
      prev.map((s) => ({
        ...s,
        doviz,
        dovizKuru: kur,
        borcYerel: yuvarla(s.borc * kur),
        alacakYerel: yuvarla(s.alacak * kur),
      })),
    )
  }, [])

  const kurGetir = useCallback(
    async (doviz: string, tarih: Dayjs) => {
      if (doviz === 'TRY') {
        setDovizKuru(1)
        setKurTarihi(tarih.format('YYYY-MM-DD'))
        satirlaraKurUygula(doviz, 1)
        return
      }
      try {
        const gun = tarih.format('YYYY-MM-DD')
        const [gunluk, son] = await Promise.all([dovizApi.getKurlar(gun), dovizApi.getSonKurlar()])
        const ayniGun = gunluk.find((x) => x.dovizKodu === doviz)
        const kur = ayniGun?.satisKuru ?? son.find((x) => x.dovizKodu === doviz)?.satisKuru ?? null
        const kurTarih = ayniGun?.satisKuru != null ? (ayniGun.tarih ?? gun) : (son.find((x) => x.dovizKodu === doviz)?.tarih ?? null)
        if (kur == null) {
          setDovizKuru(null)
          setKurTarihi(null)
          satirlaraKurUygula(doviz, 0)
          message.warning(`${doviz} için kur bulunamadı`)
          return
        }
        setDovizKuru(kur)
        setKurTarihi(kurTarih)
        satirlaraKurUygula(doviz, kur)
      } catch {
        message.warning('Kur bilgisi alınamadı')
      }
    },
    [message, satirlaraKurUygula],
  )

  const doldur = useCallback((f: CariHesapFis) => {
    const dt = dayjs(f.fisTarihi)
    setId(f.id)
    setFisTipi(f.fisTipi)
    setFisNo(f.fisNo)
    setFisTarihi(dt)
    setSaat(dt.format('HH:mm:ss'))
    setBelgeNo(f.belgeNo ?? '')
    setK(f.k ?? '')
    setErisimKodu(f.erisimKodu ?? '')
    setOzelKod(f.ozelKod ?? '')
    setDovizCinsi(f.dovizCinsi ?? 'TRY')
    setDovizKuru(f.dovizKuru == null ? 1 : Number(f.dovizKuru))
    setKurTarihi(f.kurTarihi ?? null)
    setMasrafYeri(f.masrafYeri ?? '')
    setAciklama(f.aciklama ?? '')
    setSatirlar(
      (f.hareketler ?? []).map((h) => ({
        key: String(h.id ?? yeniSatirKey()),
        cariHesapId: h.cariHesapId,
        cariKod: h.cariHesap?.kod ?? '',
        cariAd: h.cariHesap?.ad ?? '',
        ozelKod: h.ozelKod ?? '',
        hesapKodu: h.hesapKodu ?? '',
        hesapAdi: h.hesapAdi ?? '',
        aciklama: h.aciklama ?? '',
        vadeTarihi: h.vadeTarihi ? dayjs(h.vadeTarihi) : null,
        belgeNo: h.belgeNo ?? '',
        borc: Number(h.borc) || 0,
        alacak: Number(h.alacak) || 0,
        doviz: h.doviz ?? f.dovizCinsi ?? 'TRY',
        dovizKuru: h.dovizKuru == null ? 1 : Number(h.dovizKuru),
        borcYerel: Number(h.borcYerel) || 0,
        alacakYerel: Number(h.alacakYerel) || 0,
        belgeTuru: h.belgeTuru ?? null,
        belgeId: h.belgeId ?? null,
        kontrol: h.kontrol ?? '',
      })),
    )
    temizle()
  }, [temizle])

  const load = useCallback(
    async (fid: number) => {
      setLoading(true)
      try {
        doldur(await cariHesapFisApi.getById(fid))
      } catch {
        message.warning('Fiş yüklenemedi')
      } finally {
        setLoading(false)
      }
    },
    [doldur, message],
  )

  const yeni = useCallback(() => {
    setId(null)
    setFisNo(null)
    setFisTarihi(dayjs())
    setSaat('00:00:00')
    setBelgeNo('')
    setK('')
    setErisimKodu('')
    setOzelKod('')
    setDovizCinsi('TRY')
    setDovizKuru(1)
    setKurTarihi(null)
    setMasrafYeri('')
    setAciklama('')
    setSatirlar([bosSatir('TRY', 1)])
    temizle()
  }, [temizle])

  useEffect(() => {
    if (propId) load(propId)
    else yeni()
  }, [propId])

  useEffect(() => {
    if (!id && fisTipi && fisNo == null) {
      cariHesapFisApi.sonrakiNo(fisTipi).then(setFisNo).catch(() => {})
    }
  }, [id, fisTipi, fisNo])

  const updateSatir = useCallback((key: string, patch: Partial<FisSatir>) => {
    setSatirlar((prev) =>
      prev.map((s) => {
        if (s.key !== key) return s
        const next = { ...s, ...patch }
        next.borcYerel = yuvarla(next.borc * (next.dovizKuru || 0))
        next.alacakYerel = yuvarla(next.alacak * (next.dovizKuru || 0))
        return next
      }),
    )
  }, [])

  const satirEkle = () => {
    const kur = dovizKuru ?? 0
    setSatirlar((prev) => [...prev, bosSatir(dovizCinsi, kur)])
  }

  const satirSil = (key: string) => setSatirlar((prev) => prev.filter((s) => s.key !== key))

  const toplamlar = useMemo(() => {
    return satirlar.reduce(
      (acc, s) => ({
        borc: acc.borc + s.borc,
        alacak: acc.alacak + s.alacak,
        borcYerel: acc.borcYerel + s.borcYerel,
        alacakYerel: acc.alacakYerel + s.alacakYerel,
      }),
      { borc: 0, alacak: 0, borcYerel: 0, alacakYerel: 0 },
    )
  }, [satirlar])

  const handleKaydet = async () => {
    const gecerli = satirlar.filter((s) => s.cariHesapId > 0)
    if (!gecerli.length) {
      message.warning('En az bir cari hesap satırı girilmelidir')
      return
    }
    for (const s of gecerli) {
      if (s.borc > 0 && s.alacak > 0) {
        message.warning('Satırda borç ve alacak aynı anda girilemez')
        return
      }
      if (s.borc === 0 && s.alacak === 0) {
        message.warning('Her satırda borç veya alacak girilmelidir')
        return
      }
    }
    setSaving(true)
    try {
      const payload: CariHesapFisFormData = {
        fisTipi,
        fisTarihi: `${fisTarihi.format('YYYY-MM-DD')}T${saatNormalize(saat)}`,
        belgeNo: belgeNo.trim() || null,
        k: k.trim() || null,
        erisimKodu: erisimKodu.trim() || null,
        ozelKod: ozelKod.trim() || null,
        dovizCinsi,
        dovizKuru,
        kurTarihi,
        masrafYeri: masrafYeri.trim() || null,
        aciklama: aciklama.trim() || null,
        hareketler: gecerli.map((s) => ({
          cariHesapId: s.cariHesapId,
          ozelKod: s.ozelKod.trim() || null,
          hesapKodu: s.hesapKodu.trim() || null,
          hesapAdi: s.hesapAdi.trim() || null,
          aciklama: s.aciklama.trim() || null,
          vadeTarihi: s.vadeTarihi ? s.vadeTarihi.format('YYYY-MM-DD') : null,
          belgeNo: s.belgeNo.trim() || null,
          borc: s.borc,
          alacak: s.alacak,
          doviz: s.doviz,
          dovizKuru: s.dovizKuru,
          belgeTuru: s.belgeTuru,
          belgeId: s.belgeId,
          kontrol: s.kontrol.trim() || null,
        })),
      }
      if (id) {
        await cariHesapFisApi.update(id, payload)
        message.success('Kaydedildi')
      } else {
        const created = await cariHesapFisApi.create(payload)
        setId(created.id)
        setFisNo(created.fisNo)
        message.success(`Kaydedildi (Fiş No: ${String(created.fisNo).padStart(8, '0')})`)
      }
      temizle()
    } catch (e) {
      message.error('Kayıt sırasında hata: ' + ((e as Error)?.message ?? String(e)))
    } finally {
      setSaving(false)
    }
  }

  const gezin = async (yon: -1 | 1) => {
    try {
      const list = await cariHesapFisApi.list()
      const idx = list.findIndex((f) => f.id === id)
      if (idx < 0) {
        message.info('Önce kaydı yükleyin')
        return
      }
      const hedef = list[idx + yon]
      if (!hedef) {
        message.info(yon < 0 ? 'İlk kayıttasınız' : 'Son kayıttasınız')
        return
      }
      doldur(hedef)
    } catch {
      message.warning('Kayıt yüklenemedi')
    }
  }

  const handleSil = () => {
    if (!id) return
    modal.confirm({
      title: 'Fişi Sil',
      content: 'Bu cari hesap fişini silmek istediğinize emin misiniz?',
      okText: 'Evet, Sil',
      cancelText: 'İptal',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSaving(true)
        try {
          await cariHesapFisApi.remove(id)
          message.success('Fiş silindi')
          yeni()
        } catch {
          message.error('Silme sırasında hata oluştu')
        } finally {
          setSaving(false)
        }
      },
    })
  }

  const toolbarButtons = createToolbarButtons(
    {
      onNew: yeni,
      onSave: handleKaydet,
      onPrevious: () => gezin(-1),
      onNext: () => gezin(1),
      onDelete: handleSil,
    },
    { save: { accent: kirli } },
  )

  const columns = useMemo<ColDef<FisSatir>[]>(
    () => [
      {
        headerName: 'Cari Hesap Kodu',
        field: 'cariKod',
        width: 160,
        cellClass: '!p-0',
        cellRenderer: (p: { data: FisSatir }) => (
          <SearchableCariSelect
            value={p.data.cariKod}
            widthClass="!w-full"
            className="!w-full !h-full !text-[12px]"
            onChange={(kod, rec) =>
              updateSatir(p.data.key, {
                cariKod: kod,
                cariAd: rec?.ad ?? '',
                cariHesapId: rec?.id ?? 0,
                hesapKodu: rec?.musteriHesapKodu ?? rec?.saticiHesapKodu ?? p.data.hesapKodu,
              })
            }
          />
        ),
      },
      { headerName: 'Cari Hesap Adı', field: 'cariAd', flex: 1, minWidth: 150 },
      {
        headerName: 'Özel Kod',
        field: 'ozelKod',
        width: 100,
        cellClass: '!p-0',
        cellRenderer: (p: { data: FisSatir }) => (
          <Input
            size="small"
            variant="borderless"
            value={p.data.ozelKod}
            onChange={(e) => updateSatir(p.data.key, { ozelKod: e.target.value })}
            className="!w-full !h-full !text-[12px]"
          />
        ),
      },
      {
        headerName: 'Hesap Kodu',
        field: 'hesapKodu',
        width: 120,
        cellClass: '!p-0',
        cellRenderer: (p: { data: FisSatir }) => (
          <Input
            size="small"
            variant="borderless"
            value={p.data.hesapKodu}
            onChange={(e) => updateSatir(p.data.key, { hesapKodu: e.target.value })}
            className="!w-full !h-full !text-[12px]"
          />
        ),
      },
      {
        headerName: 'Hesap Adı',
        field: 'hesapAdi',
        flex: 1,
        minWidth: 140,
        cellClass: '!p-0',
        cellRenderer: (p: { data: FisSatir }) => (
          <Input
            size="small"
            variant="borderless"
            value={p.data.hesapAdi}
            onChange={(e) => updateSatir(p.data.key, { hesapAdi: e.target.value })}
            className="!w-full !h-full !text-[12px]"
          />
        ),
      },
      {
        headerName: 'Açıklama',
        field: 'aciklama',
        flex: 1,
        minWidth: 140,
        cellClass: '!p-0',
        cellRenderer: (p: { data: FisSatir }) => (
          <Input
            size="small"
            variant="borderless"
            value={p.data.aciklama}
            onChange={(e) => updateSatir(p.data.key, { aciklama: e.target.value })}
            className="!w-full !h-full !text-[12px]"
          />
        ),
      },
      {
        headerName: 'Vade Tarihi',
        field: 'vadeTarihi',
        width: 130,
        cellClass: '!p-0',
        cellRenderer: (p: { data: FisSatir }) => (
          <DatePicker
            size="small"
            variant="borderless"
            value={p.data.vadeTarihi}
            onChange={(d) => updateSatir(p.data.key, { vadeTarihi: d })}
            format="DD.MM.YYYY"
            className="!w-full !text-[12px]"
          />
        ),
      },
      {
        headerName: 'Belge No',
        field: 'belgeNo',
        width: 100,
        cellClass: '!p-0',
        cellRenderer: (p: { data: FisSatir }) => (
          <Input
            size="small"
            variant="borderless"
            value={p.data.belgeNo}
            onChange={(e) => updateSatir(p.data.key, { belgeNo: e.target.value })}
            className="!w-full !h-full !text-[12px]"
          />
        ),
      },
      {
        headerName: 'Borç',
        field: 'borc',
        width: 110,
        cellClass: '!p-0',
        type: 'rightAligned',
        cellRenderer: (p: { data: FisSatir }) => (
          <TurkishNumberInput
            value={p.data.borc}
            onChange={(v) => updateSatir(p.data.key, { borc: v, alacak: 0 })}
            className="!w-full !h-full !text-[12px] !text-right"
          />
        ),
      },
      {
        headerName: 'Alacak',
        field: 'alacak',
        width: 110,
        cellClass: '!p-0',
        type: 'rightAligned',
        cellRenderer: (p: { data: FisSatir }) => (
          <TurkishNumberInput
            value={p.data.alacak}
            onChange={(v) => updateSatir(p.data.key, { alacak: v, borc: 0 })}
            className="!w-full !h-full !text-[12px] !text-right"
          />
        ),
      },
      { headerName: 'Döviz', field: 'doviz', width: 70 },
      {
        headerName: 'Döviz Kuru',
        field: 'dovizKuru',
        width: 90,
        type: 'rightAligned',
        valueFormatter: (p) => (p.value == null ? '-' : Number(p.value).toFixed(6)),
      },
      {
        headerName: 'Borç Yerel',
        field: 'borcYerel',
        width: 110,
        type: 'rightAligned',
        valueFormatter: (p) => formatTR(Number(p.value)),
      },
      {
        headerName: 'Alacak Yerel',
        field: 'alacakYerel',
        width: 110,
        type: 'rightAligned',
        valueFormatter: (p) => formatTR(Number(p.value)),
      },
      {
        headerName: 'Kontrol',
        field: 'kontrol',
        width: 100,
        cellClass: '!p-0',
        cellRenderer: (p: { data: FisSatir }) => (
          <Input
            size="small"
            variant="borderless"
            value={p.data.kontrol}
            onChange={(e) => updateSatir(p.data.key, { kontrol: e.target.value })}
            className="!w-full !h-full !text-[12px]"
          />
        ),
      },
      {
        headerName: '',
        width: 44,
        sortable: false,
        cellClass: '!p-0 !flex !items-center !justify-center',
        cellRenderer: (p: { data: FisSatir }) => (
          <Popconfirm title="Satır silinsin mi?" okText="Sil" cancelText="Vazgeç" onConfirm={() => satirSil(p.data.key)}>
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        ),
      },
    ],
    [updateSatir],
  )

  return (
    <div className="!h-full !flex !flex-col">
      <div className="!bg-white !border !border-gray-200 !rounded-sm !flex-1 !flex !flex-col !overflow-hidden">
        <CardToolbar buttons={toolbarButtons} />
        <Spin spinning={loading || saving}>
          <div className="!px-3 !py-2 !border-b !border-gray-200 !flex-shrink-0">
            <div className="!flex !flex-col !gap-1.5 !max-w-2xl">
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[10px] !font-semibold !uppercase !w-24 !shrink-0 !text-[#333]">Fiş Tipi</label>
                <Input size="small" readOnly value={`${fisTipi}-${fisTipiEtiketi(fisTipi)}`} className="!w-48 !text-[11px]" />
              </div>
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[10px] !font-semibold !uppercase !w-24 !shrink-0 !text-[#333]">Fiş No</label>
                <Input
                  size="small"
                  readOnly
                  value={fisNo != null ? String(fisNo).padStart(8, '0') : 'Otomatik'}
                  className="!w-48 !text-[11px]"
                />
              </div>
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[10px] !font-semibold !uppercase !w-24 !shrink-0 !text-[#333]">Fiş Tarihi</label>
                <DatePicker
                  size="small"
                  value={fisTarihi}
                  onChange={(d) => {
                    if (!d) return
                    setFisTarihi(d)
                    if (dovizCinsi !== 'TRY') kurGetir(dovizCinsi, d)
                  }}
                  format="DD.MM.YYYY"
                  allowClear={false}
                  className="!w-36 !text-[11px]"
                />
                <Input
                  size="small"
                  value={saat}
                  onChange={(e) => setSaat(e.target.value)}
                  placeholder="00:00:00"
                  maxLength={8}
                  className="!w-24 !text-[11px]"
                />
              </div>
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[10px] !font-semibold !uppercase !w-24 !shrink-0 !text-[#333]">Belge No</label>
                <Input size="small" value={belgeNo} onChange={(e) => setBelgeNo(e.target.value)} maxLength={50} className="!w-48 !text-[11px]" />
              </div>
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[10px] !font-semibold !uppercase !w-24 !shrink-0 !text-[#333]">K</label>
                <Input size="small" value={k} onChange={(e) => setK(e.target.value)} maxLength={50} className="!w-48 !text-[11px]" />
              </div>
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[10px] !font-semibold !uppercase !w-24 !shrink-0 !text-[#333]">Erişim Kodu</label>
                <Input size="small" value={erisimKodu} onChange={(e) => setErisimKodu(e.target.value)} maxLength={50} className="!w-48 !text-[11px]" />
              </div>
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[10px] !font-semibold !uppercase !w-24 !shrink-0 !text-[#333]">Özel Kod</label>
                <Input size="small" value={ozelKod} onChange={(e) => setOzelKod(e.target.value)} maxLength={50} className="!w-48 !text-[11px]" />
              </div>
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[10px] !font-semibold !uppercase !w-24 !shrink-0 !text-[#333]">Döviz Cinsi</label>
                <Select
                  size="small"
                  showSearch
                  optionFilterProp="label"
                  value={dovizCinsi}
                  onChange={(v) => {
                    setDovizCinsi(v)
                    kurGetir(v, fisTarihi)
                  }}
                  options={dovizSecenekleri}
                  className="!w-40 !text-[11px]"
                />
                <Input
                  size="small"
                  readOnly
                  value={dovizKuru == null ? '' : Number(dovizKuru).toFixed(6)}
                  title={kurTarihi ? `Kur tarihi: ${dayjs(kurTarihi).format('DD.MM.YYYY')}` : 'Kur'}
                  className="!w-28 !text-[11px]"
                />
              </div>
              <div className="!flex !items-center !gap-1.5">
                <label className="!text-[10px] !font-semibold !uppercase !w-24 !shrink-0 !text-[#333]">Masraf Yeri</label>
                <AutoComplete
                  size="small"
                  value={masrafYeri}
                  onChange={(v) => setMasrafYeri(v ?? '')}
                  options={[]}
                  placeholder="Ara..."
                  className="!w-48 !text-[11px]"
                />
              </div>
              <div className="!flex !items-start !gap-1.5">
                <label className="!text-[10px] !font-semibold !uppercase !w-24 !shrink-0 !text-[#333] !pt-1">Açıklama</label>
                <TextArea
                  size="small"
                  value={aciklama}
                  onChange={(e) => setAciklama(e.target.value)}
                  maxLength={1000}
                  autoSize={{ minRows: 1, maxRows: 2 }}
                  className="!w-48 !text-[11px]"
                />
              </div>
            </div>
          </div>

          <div className="!flex-1 !min-h-0 !flex !flex-col !p-3">
            <div className="!flex !items-center !justify-between !mb-1.5 !flex-shrink-0">
              <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide">Fiş Kalemleri</div>
              <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={satirEkle} className="!text-[12px]">
                Satır Ekle
              </Button>
            </div>

            <div className="!flex-1 !min-h-0" style={{ minHeight: 240 }}>
              <DataGrid
                rowData={satirlar}
                columnDefs={columns}
                domLayout="normal"
                getRowId={(p) => p.data.key}
                rowSelection="single"
                enableColumnChooser={false}
                exportFileName={`cari-hesap-fisi-${fisTipi}`}
                suppressCellFocus
              />
            </div>

            <div className="!flex !items-center !justify-end !gap-6 !border-t !border-gray-200 !mt-2 !pt-2 !text-[11px] !tabular-nums !flex-shrink-0">
              <span>Borç: <b>{formatTR(toplamlar.borc)}</b></span>
              <span>Alacak: <b>{formatTR(toplamlar.alacak)}</b></span>
              <span>Borç (₺): <b>{formatTR(toplamlar.borcYerel)}</b></span>
              <span>Alacak (₺): <b>{formatTR(toplamlar.alacakYerel)}</b></span>
              <span className="!text-[#9ca3af]">{satirlar.length} satır</span>
            </div>
          </div>
        </Spin>
      </div>
    </div>
  )
}
