'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Button, Input, InputNumber, Select, DatePicker, Table, App, Tag, Card, Divider, Dropdown, Modal } from 'antd'
import type { ColumnsType, MenuProps } from 'antd/es/table'
import {
  ScissorOutlined,
  SendOutlined,
  EditOutlined,
  UndoOutlined,
  FireOutlined,
  ScanOutlined,
  ClearOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { iadeTalepApi } from '@/lib/iade-talep-api'
import { barkodApi } from '@/lib/barkod-api'
import { malzemeYonetimFisleriApi, type MalzemeYonetimFisi, type MalzemeYonetimFisiKalem } from '@/lib/malzeme-yonetim-fisleri-api'
import { siparisApi, type Siparis } from '@/lib/siparis-api'

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
  kaynakFisId?: number | null
  kaynakFisNo?: string | null
  kaynakKalemId?: number | null
  manuelFire?: boolean
}

interface KumasGrupBilgi {
  kumasAd: string
  renk: string
  gerekliMT: number
  kesimFazlasi: number
}

interface BedenBilgi {
  beden: string
  miktar: number
}

interface RenkBilgi {
  renkAd: string
  renkLabel: string
  bedenler: BedenBilgi[]
}

interface ModelBilgi {
  modelKod: string
  modelAd: string
  kumasGruplari: KumasGrupBilgi[]
  renkler: RenkBilgi[]
}

interface SiparisBilgi {
  siparisNo: string
  modeller: ModelBilgi[]
}

export default function KesimKarti() {
  const { message } = App.useApp()
  const [kesimKartlari, setKesimKartlari] = useState<KesimKartiRecord[]>([])
  const [barkodInput, setBarkodInput] = useState('')
  const [tarih, setTarih] = useState(dayjs())
  const [seciliSiparis, setSeciliSiparis] = useState<string>('')
  const [seciliModel, setSeciliModel] = useState<string>('')
  const [seciliRenk, setSeciliRenk] = useState<string>('')
  // Beden kırılımlı kesilen adetleri (beden → adet)
  const [kesilenAdetler, setKesilenAdetler] = useState<Record<string, number | null>>({})
  const [fireMiktar, setFireMiktar] = useState<number>(0)
  const [fireOtomatik, setFireOtomatik] = useState<boolean>(true)
  const [duzenlenenId, setDuzenlenenId] = useState<number | null>(null)
  // Faz A: 140-Üretime Çıkış Fişi kaynağı (fiş → kalem → modele paylaştırma)
  const [fisListesi, setFisListesi] = useState<MalzemeYonetimFisi[]>([])
  const [fisYukleniyor, setFisYukleniyor] = useState(false)
  const [seciliFisId, setSeciliFisId] = useState<number | null>(null)
  const [seciliFis, setSeciliFis] = useState<MalzemeYonetimFisi | null>(null)
  const [seciliFisKalemId, setSeciliFisKalemId] = useState<number | null>(null)
  // Üretime Çıkılanlar modalı
  const [cikisModalAcik, setCikisModalAcik] = useState(false)
  const [modalFisId, setModalFisId] = useState<number | null>(null)
  const [modalFis, setModalFis] = useState<MalzemeYonetimFisi | null>(null)
  const [modalYukleniyor, setModalYukleniyor] = useState(false)
  // Gerçek sipariş verisi (kalem→renk→beden) — mock yerine backend'den
  const [siparisler, setSiparisler] = useState<SiparisBilgi[]>([])
  const [siparisYukleniyor, setSiparisYukleniyor] = useState(false)
  // Barkod okutularak mı dolduruldu? (Sipariş/Model/Renk readonly olur)
  const [barkodYoluyla, setBarkodYoluyla] = useState(false)

  const seciliSiparisData = siparisler.find((s) => s.siparisNo === seciliSiparis)
  const seciliModelData = seciliSiparisData?.modeller.find((m) => m.modelKod === seciliModel)
  const seciliRenkData = seciliModelData?.renkler.find((r) => r.renkAd === seciliRenk)
  // Kumaş grubu seçimsiz: renkle eşleşen, yoksa ilk grup (fiş kalemi kumaşı Üretime Çıkılanlar'dan gelir)
  const seciliKumasGrubu = seciliModelData?.kumasGruplari.find((k) => k.renk === seciliRenk)
    ?? seciliModelData?.kumasGruplari[0]

  // Fiş kalem MT'si: netMetre > brutMetre > miktar > adet
  const kalemMT = (k: MalzemeYonetimFisiKalem): number =>
    Number(k.netMetre) || Number(k.brutMetre) || Number(k.miktar) || Number(k.adet) || 0
  const seciliFisKalem = seciliFis?.kalemler?.find((k) => k.id === seciliFisKalemId) ?? null
  const seciliKalemMT = seciliFisKalem ? kalemMT(seciliFisKalem) : 0
  // Verilen kumaş listeden gelir (Üretime Çıkılanlar'da seçilen kalem) — elle girilmez
  const kumasMiktar = seciliKalemMT

  const gerekliMT = seciliKumasGrubu?.gerekliMT ?? 0
  const kesimFazlasi = seciliKumasGrubu?.kesimFazlasi ?? 0
  const brutMT = gerekliMT * (1 + kesimFazlasi / 100)

  const toplamRenkAdet = seciliModelData
    ? seciliModelData.renkler.reduce((acc, r) => acc + r.bedenler.reduce((a, b) => a + (b.miktar ?? 0), 0), 0)
    : 0
  const birimTuketim = toplamRenkAdet > 0 ? gerekliMT / toplamRenkAdet : 0
  // Renk toplamı (beden planlananları toplamı)
  const renkPlanlananToplam = seciliRenkData?.bedenler.reduce((s, b) => s + (b.miktar ?? 0), 0) ?? 0
  const planlananOf = (beden: string): number =>
    seciliRenkData?.bedenler.find((b) => b.beden === beden)?.miktar ?? 0
  // Beklenen adet beden payına göre dağıtılır (kumaş payı orantılı)
  const beklenenOf = (beden: string): number => {
    if (birimTuketim <= 0 || renkPlanlananToplam <= 0 || kumasMiktar <= 0) return 0
    return Math.floor((kumasMiktar * (planlananOf(beden) / renkPlanlananToplam)) / birimTuketim)
  }
  const beklenenAdet = birimTuketim > 0 ? Math.floor(kumasMiktar / birimTuketim) : 0
  const toplamKesilen: number = Object.values(kesilenAdetler).reduce<number>((s, v) => s + (v ?? 0), 0)
  const kullanilanMT = toplamKesilen * birimTuketim
  const kalanMT = kumasMiktar - kullanilanMT
  const fireOrani = kumasMiktar > 0 ? (fireMiktar / kumasMiktar) * 100 : 0

  // Aynı fiş kaleminden daha önce ayrılan toplam (1 kumaş → N model paylaştırma havuzu)
  const kalemeAyrilanMT = seciliFisKalemId == null ? 0 : kesimKartlari
    .filter((k) => k.kaynakKalemId === seciliFisKalemId && (duzenlenenId === null || k.id !== duzenlenenId))
    .reduce((s, k) => s + (k.kumasMiktar || 0), 0)
  const kalemdeKalanMT = Math.max(0, seciliKalemMT - kalemeAyrilanMT)

  // 140 fiş listesi (sadece üretime çıkış)
  useEffect(() => {
    setFisYukleniyor(true)
    malzemeYonetimFisleriApi.list()
      .then((fisler) => setFisListesi((fisler ?? []).filter((f) => f.irsaliyeTipi === '140')))
      .catch(() => setFisListesi([]))
      .finally(() => setFisYukleniyor(false))
  }, [])

  // Gerçek sipariş listesi (sipariş no seçimi için)
  useEffect(() => {
    setSiparisYukleniyor(true)
    siparisApi
      .list()
      .then((liste) => setSiparisler((liste ?? []).map(normalizeSiparis)))
      .catch(() => setSiparisler([]))
      .finally(() => setSiparisYukleniyor(false))
  }, [])

  // Tek siparişi tam detayıyla (renk+beden) getirir; mevcutsa günceller, yoksa ekler.
  const yukleSiparis = useCallback(async (siparisNo: string) => {
    setSiparisYukleniyor(true)
    try {
      const s = await siparisApi.bySiparisNo(siparisNo)
      const n = normalizeSiparis(s)
      setSiparisler((prev) =>
        prev.some((x) => x.siparisNo === n.siparisNo)
          ? prev.map((x) => (x.siparisNo === n.siparisNo ? { ...x, ...n } : x))
          : [...prev, n],
      )
    } finally {
      setSiparisYukleniyor(false)
    }
  }, [])

  // Fiş detayı (kalemleriyle) yükle
  useEffect(() => {
    if (seciliFisId == null) {
      setSeciliFis(null)
      setSeciliFisKalemId(null)
      return
    }
    // Liste öğesinde kalemler yoksa detayı çek, varsa listeden kullan
    const listedeki = fisListesi.find((f) => f.id === seciliFisId)
    if (listedeki?.kalemler && listedeki.kalemler.length > 0) {
      setSeciliFis(listedeki)
      setSeciliFisKalemId((prev) => prev ?? listedeki.kalemler![0].id)
      return
    }
    setFisYukleniyor(true)
    malzemeYonetimFisleriApi.get(seciliFisId)
      .then((f) => {
        setSeciliFis(f)
        setSeciliFisKalemId((prev) => prev ?? f.kalemler?.[0]?.id ?? null)
      })
      .catch(() => {
        setSeciliFis(null)
        setSeciliFisKalemId(null)
      })
      .finally(() => setFisYukleniyor(false))
  }, [seciliFisId, fisListesi])

  // Modalda seçilen fişin detayı (kalemleriyle)
  useEffect(() => {
    if (!cikisModalAcik || modalFisId == null) {
      if (!cikisModalAcik) setModalFis(null)
      return
    }
    const listedeki = fisListesi.find((f) => f.id === modalFisId)
    if (listedeki?.kalemler && listedeki.kalemler.length > 0) {
      setModalFis(listedeki)
      return
    }
    setModalYukleniyor(true)
    malzemeYonetimFisleriApi.get(modalFisId)
      .then(setModalFis)
      .catch(() => setModalFis(null))
      .finally(() => setModalYukleniyor(false))
  }, [cikisModalAcik, modalFisId, fisListesi])

  // Modalden kumaş seçimi onayla
  const cikisKalemSec = (fis: MalzemeYonetimFisi, kalemId: number) => {
    setSeciliFisId(fis.id)
    setSeciliFis(fis.kalemler ? fis : { ...fis })
    setSeciliFisKalemId(kalemId)
    setKesilenAdetler({})
    setFireMiktar(0)
    setFireOtomatik(true)
    setCikisModalAcik(false)
  }

  // Kalem başına ayrılan toplam (modal kalan hesabı için)
  const kalemeAyrilan = (kalemId: number): number => kesimKartlari
    .filter((k) => k.kaynakKalemId === kalemId && (duzenlenenId === null || k.id !== duzenlenenId))
    .reduce((s, k) => s + (k.kumasMiktar || 0), 0)

  // Fire otomatik: kalan MT'yi fireye yaz (kullanıcı dokununca manuel moda geçilir)
  useEffect(() => {
    if (!fireOtomatik) return
    setFireMiktar(Math.max(0, Math.round(kalanMT * 10) / 10))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kalanMT, fireOtomatik])

  const barkodTara = async () => {
    if (!barkodInput.trim()) return
    const ham = barkodInput.trim()
    try {
      const eslesme = await barkodApi.tar(ham)
      await yukleSiparis(eslesme.siparisNo)
      setSeciliSiparis(eslesme.siparisNo)
      setSeciliModel(eslesme.modelKod)
      setSeciliRenk(eslesme.renkKod)
      setKesilenAdetler(eslesme.beden ? { [eslesme.beden]: null } : {})
      setFireMiktar(0)
      setFireOtomatik(true)
      setBarkodYoluyla(true)
      message.success(`Barkod okundu: ${eslesme.siparisNo} / ${eslesme.modelKod}`)
    } catch {
      // Son fallback: doğrudan barkod kodu (örn. 000000007) ile eşleşmeyi ara
      try {
        const eslesme = await barkodApi.findByKod(ham)
        await yukleSiparis(eslesme.siparisNo)
        setSeciliSiparis(eslesme.siparisNo)
        setSeciliModel(eslesme.modelKod)
        setSeciliRenk(eslesme.renkKod)
        setKesilenAdetler(eslesme.beden ? { [eslesme.beden]: null } : {})
        setFireMiktar(0)
        setFireOtomatik(true)
        setBarkodYoluyla(true)
        message.success(`Barkod okundu: ${eslesme.siparisNo} / ${eslesme.modelKod}`)
      } catch {
        message.error('Barkod ile eşleşen kayıt bulunamadı')
      }
    }

    setBarkodInput('')
  }

  const temizle = (fisKoru = true) => {
    setBarkodInput('')
    setTarih(dayjs())
    setSeciliSiparis('')
    setSeciliModel('')
    setSeciliRenk('')
    setKesilenAdetler({})
    setFireMiktar(0)
    setFireOtomatik(true)
    setDuzenlenenId(null)
    setBarkodYoluyla(false)
    if (!fisKoru) {
      setSeciliFisId(null)
      setSeciliFis(null)
      setSeciliFisKalemId(null)
    }
  }

  const kaydet = () => {
    if (!seciliSiparis || !seciliModel || !seciliRenk) {
      message.warning('Lütfen sipariş, model ve renk seçin')
      return
    }
    if (seciliFisKalemId == null || kumasMiktar <= 0) {
      message.warning('Önce Üretime Çıkılanlar’dan kumaş seçin')
      return
    }
    const girisler = (seciliRenkData?.bedenler ?? [])
      .map((b) => ({ beden: b.beden, adet: kesilenAdetler[b.beden] ?? 0 }))
      .filter((x) => x.adet > 0)
    if (duzenlenenId !== null && girisler.length !== 1) {
      message.warning('Düzenlemede tek beden adedi girin')
      return
    }
    if (girisler.length === 0) {
      message.warning('Lütfen beden beden kesilen adet girin')
      return
    }
    // Paylaştırma guard: fiş kalem havuzunu aşma (1 kumaş → N model)
    if (seciliFisKalemId != null && seciliKalemMT > 0 && kumasMiktar > kalemdeKalanMT + 0.0001) {
      message.warning(`Bu kalemden kalan ${kalemdeKalanMT.toFixed(1)} MT — ayrılan miktar aşıyor`)
      return
    }

    const tarihStr = tarih.format('YYYY-MM-DD')
    const kumasAd = seciliKumasGrubu?.kumasAd ?? seciliFisKalem?.malzeme?.ad ?? ''
    const kumasRenk = seciliKumasGrubu?.renk ?? ''
    const iadeTalep = duzenlenenId !== null ? (kesimKartlari.find((k) => k.id === duzenlenenId)?.iadeTalep ?? false) : false

    if (duzenlenenId !== null) {
      const g = girisler[0]
      setKesimKartlari((prev) => prev.map((k) => (k.id === duzenlenenId ? {
        ...k,
        siparisNo: seciliSiparis,
        modelKod: seciliModel,
        modelAd: seciliModelData?.modelAd ?? k.modelAd,
        renkAd: seciliRenk,
        beden: g.beden,
        planlananMiktar: planlananOf(g.beden),
        kesilenMiktar: g.adet,
        fireMiktar,
        kumasAd,
        kumasRenk,
        gerekliMiktar: gerekliMT,
        brutMiktar: brutMT,
        kumasMiktar,
        birimTuketim,
        beklenenAdet: beklenenOf(g.beden),
        kalanMT,
        fireOrani,
        kaynakFisId: seciliFisId,
        kaynakFisNo: seciliFis?.irsaliyeNo ?? k.kaynakFisNo ?? null,
        kaynakKalemId: seciliFisKalemId ?? k.kaynakKalemId ?? null,
        manuelFire: !fireOtomatik,
        iadeTalep,
        tarih: tarihStr,
      } : k)))
      message.success('Kesim kartı güncellendi')
    } else {
      const simdi = Date.now()
      const yeniKartlar: KesimKartiRecord[] = girisler.map((g, i) => ({
        id: simdi + i,
        siparisNo: seciliSiparis,
        modelKod: seciliModel,
        modelAd: seciliModelData?.modelAd ?? '',
        renkAd: seciliRenk,
        beden: g.beden,
        planlananMiktar: planlananOf(g.beden),
        kesilenMiktar: g.adet,
        fireMiktar,
        kumasAd,
        kumasRenk,
        gerekliMiktar: gerekliMT,
        brutMiktar: brutMT,
        kumasMiktar,
        birimTuketim,
        beklenenAdet: beklenenOf(g.beden),
        kalanMT,
        fireOrani,
        kaynakFisId: seciliFisId,
        kaynakFisNo: seciliFis?.irsaliyeNo ?? null,
        kaynakKalemId: seciliFisKalemId,
        manuelFire: !fireOtomatik,
        iadeTalep: false,
        tarih: tarihStr,
        durum: 'KESILDI',
      }))
      setKesimKartlari((prev) => [...yeniKartlar, ...prev])
      message.success(`${yeniKartlar.length} beden kesildi`)
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
      title: 'Kaynak',
      dataIndex: 'kaynakFisNo',
      width: 90,
      render: (v: string | null | undefined, r: KesimKartiRecord) => v ? (
        <span title={`Kalem ${r.kaynakKalemId ?? ''}`}>{v}{r.manuelFire ? ' •M' : ''}</span>
      ) : (
        <span className="text-gray-300">—</span>
      ),
    },
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
              setKesilenAdetler(record.beden ? { [record.beden]: record.kesilenMiktar } : {})
              setFireMiktar(record.fireMiktar)
              setFireOtomatik(!record.manuelFire)
              setBarkodYoluyla(false)
              if (record.kaynakFisId) setSeciliFisId(record.kaynakFisId)
              if (record.kaynakKalemId) setSeciliFisKalemId(record.kaynakKalemId)
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
          {/* Barkod + Tara + Üretime Çıkılanlar aynı satırda */}
          <div className="flex gap-2 mb-2 items-stretch">
            <Input
              placeholder="Barkod okutun: SIPARIS|#|KOD"
              value={barkodInput}
              onChange={(e) => setBarkodInput(e.target.value)}
              onPressEnter={barkodTara}
              prefix={<ScanOutlined className="!text-[20px] text-gray-400" />}
              className="!h-14 !text-[15px] !flex-1 !rounded-lg"
            />
            <Button onClick={barkodTara} icon={<ScanOutlined />} className="!h-14 !rounded-lg !font-semibold">
              Tara
            </Button>
            <Button
              icon={<SendOutlined />}
              onClick={() => {
                setModalFisId(seciliFisId)
                setCikisModalAcik(true)
              }}
              loading={fisYukleniyor}
              className="!h-14 !rounded-lg !font-semibold !border-orange-400 !text-orange-600 hover:!border-orange-500 hover:!text-orange-700"
            >
              Üretime Çıkılanlar
            </Button>
          </div>

          <Divider className="!my-2" />

          <div className="space-y-2">
            {/* Tarih + Sipariş + Model + Renk tek satırda */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-1.5">
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
                  placeholder="Sipariş"
                  loading={siparisYukleniyor}
                  value={seciliSiparis || undefined}
                  disabled={barkodYoluyla}
                  onChange={(v) => {
                    setBarkodYoluyla(false)
                    setSeciliSiparis(v)
                    setSeciliModel('')
                    setSeciliRenk('')
                    setKesilenAdetler({})
                    yukleSiparis(v)
                  }}
                  options={siparisler.map((s) => ({ label: s.siparisNo, value: s.siparisNo }))}
                />
              </div>
              <div>
                <div className="text-[9px] text-gray-400 mb-0.5 uppercase">Model</div>
                <Select
                  className="!w-full"
                  size="small"
                  placeholder="Model"
                  value={seciliModel || undefined}
                  onChange={(v) => {
                    setSeciliModel(v)
                    setSeciliRenk('')
                    setKesilenAdetler({})
                  }}
                  disabled={!seciliSiparis || barkodYoluyla}
                  options={seciliSiparisData?.modeller.map((m) => ({ label: `${m.modelKod} - ${m.modelAd}`, value: m.modelKod })) ?? []}
                />
              </div>
              <div>
                <div className="text-[9px] text-gray-400 mb-0.5 uppercase">Renk</div>
                <Select
                  className="!w-full"
                  size="small"
                  placeholder="Renk"
                  value={seciliRenk || undefined}
                  onChange={(v) => {
                    setSeciliRenk(v)
                    setKesilenAdetler({})
                  }}
                  disabled={!seciliModel || barkodYoluyla}
                  options={seciliModelData?.renkler.map((r) => ({ label: r.renkLabel, value: r.renkAd })) ?? []}
                />
              </div>
            </div>

            {/* Kumaş bilgisi (seçim yok — Üretime Çıkılanlar + model reçetesinden otomatik) */}
            {seciliRenk && seciliKumasGrubu && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 text-[12px] text-blue-700">
                Kumaş: <span className="font-bold">{seciliKumasGrubu.kumasAd} ({seciliKumasGrubu.renk})</span>
                {seciliFisKalem ? (
                  <span className="text-gray-500"> · Fiş: <span className="font-semibold text-gray-700">{seciliFis?.irsaliyeNo}</span></span>
                ) : (
                  <span className="text-orange-500"> · Fiş seçilmedi — Üretime Çıkılanlar’dan seçin</span>
                )}
                {birimTuketim > 0 && (
                  <span> · Birim Tüketim: <span className="font-semibold">{birimTuketim.toFixed(4)} MT/ADET</span></span>
                )}
                {seciliFisKalem && (
                  <span className="text-gray-500"> · Verilen: <span className="font-semibold text-gray-700">{kumasMiktar.toFixed(1)} MT</span></span>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Sağ: Kesim Bilgileri & Hesaplama */}
        <Card size="small" className="!mb-0" title={<span className="text-[10px] text-gray-500">Kesim & Hesaplama</span>}>
          <div className="space-y-2">
            {/* Beden kırılımı: planlanan + beklenen + kesilen */}
            {seciliRenkData ? (
              <div>
                <div className="text-[9px] text-gray-400 mb-1 uppercase">
                  Bedenler <span className="text-gray-300 normal-case">(planlanan / beklenen / kesilen)</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                  {seciliRenkData.bedenler.map((b) => (
                    <div key={b.beden} className="border border-gray-200 rounded px-1 py-0.5 bg-white">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[9px] font-bold text-gray-700">{b.beden}</span>
                        <span className="text-[8px] text-gray-400">pln <span className="font-semibold text-gray-600">{b.miktar}</span></span>
                      </div>
                      <div className="text-[8px] text-blue-600">bek {beklenenOf(b.beden)}</div>
                      <InputNumber
                        size="small"
                        min={0}
                        precision={0}
                        placeholder="Kesilen"
                        value={kesilenAdetler[b.beden] ?? null}
                        onChange={(v) => setKesilenAdetler((p) => ({ ...p, [b.beden]: v }))}
                        className="!w-full !mt-0.5"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-gray-300 text-center py-1">Bedenler için önce sipariş / model / renk seçin</div>
            )}
            {/* Hesaplama Özeti */}
            {kumasMiktar > 0 && birimTuketim > 0 && (
              <div className="bg-gray-50 rounded p-2 space-y-1">
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

            <div className="grid grid-cols-3 gap-1.5">
              <div className="rounded bg-gray-50 px-1.5 py-1 text-center">
                <div className="text-[8px] uppercase text-gray-400">Planlanan</div>
                <div className="text-[12px] font-bold text-gray-700">{renkPlanlananToplam.toLocaleString('tr-TR')}</div>
              </div>
              <div className="rounded bg-gray-50 px-1.5 py-1 text-center">
                <div className="text-[8px] uppercase text-gray-400">Beklenen</div>
                <div className="text-[12px] font-bold text-blue-600">{beklenenAdet.toLocaleString('tr-TR')}</div>
              </div>
              <div className="rounded bg-gray-50 px-1.5 py-1 text-center">
                <div className="text-[8px] uppercase text-gray-400">Kesilen</div>
                <div className="text-[12px] font-bold text-green-600">{toplamKesilen.toLocaleString('tr-TR')}</div>
              </div>
            </div>
            <div>
              <div className="text-[9px] text-gray-400 mb-0.5 uppercase">
                Toplam Fire Miktarı {fireOtomatik ? <Tag color="blue" className="!text-[8px] !ml-1 !mr-0 !py-0">Otomatik</Tag> : <Tag color="orange" className="!text-[8px] !ml-1 !mr-0 !py-0">Manuel</Tag>}
              </div>
              <div className="flex gap-1.5">
                <InputNumber
                  className="!w-full"
                  size="small"
                  min={0}
                  value={fireMiktar || undefined}
                  onChange={(v) => {
                    setFireMiktar(v ?? 0)
                    setFireOtomatik(false)
                  }}
                />
                {!fireOtomatik && (
                  <Button size="small" onClick={() => setFireOtomatik(true)} title="Otomatik hesaba dön">
                    Oto
                  </Button>
                )}
              </div>
            </div>

            <Divider className="!my-1" />

            <div className="grid grid-cols-3 gap-1.5">
              <div
                role="button"
                tabIndex={0}
                onClick={kaydet}
                onKeyDown={(e) => e.key === 'Enter' && kaydet()}
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg cursor-pointer border border-blue-500 bg-blue-50 hover:bg-blue-100 transition-all shadow-sm"
              >
                <ScissorOutlined className="text-[18px] text-blue-500" />
                <span className="text-[10px] font-semibold text-blue-600 text-center leading-tight">
                  {duzenlenenId !== null
                    ? 'Güncelle'
                    : (() => {
                        const n = (seciliRenkData?.bedenler ?? []).filter((b) => (kesilenAdetler[b.beden] ?? 0) > 0).length
                        return n > 0 ? `Kaydet (${n} beden)` : 'Kesim Kaydet'
                      })()}
                </span>
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => temizle()}
                onKeyDown={(e) => e.key === 'Enter' && temizle()}
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg cursor-pointer border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                <ClearOutlined className="text-[18px] text-gray-400" />
                <span className="text-[10px] font-medium text-gray-600">Temizle</span>
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => temizle(false)}
                onKeyDown={(e) => e.key === 'Enter' && temizle(false)}
                title="Form + seçili 140 fişini temizler"
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg cursor-pointer border border-gray-200 bg-white hover:border-red-300 hover:bg-red-50 transition-all"
              >
                <DeleteOutlined className="text-[18px] text-gray-400" />
                <span className="text-[10px] font-medium text-gray-600 text-center leading-tight">Fiş Dahil Temizle</span>
              </div>
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

      {/* Üretime Çıkılanlar modalı: 140 fişi → kumaş kalemi seç */}
      <Modal
        title="Üretime Çıkılanlar (140)"
        open={cikisModalAcik}
        onCancel={() => setCikisModalAcik(false)}
        footer={null}
        width={1400}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <div className="text-[10px] text-gray-500 uppercase mb-1">Fişler</div>
            <Table<MalzemeYonetimFisi>
              size="small"
              dataSource={fisListesi}
              rowKey="id"
              pagination={false}
              scroll={{ y: 300 }}
              locale={{ emptyText: fisYukleniyor ? 'Yükleniyor...' : '140 fişi yok' }}
              rowClassName={(r) => r.id === (modalFisId ?? seciliFisId) ? 'bg-orange-50 cursor-pointer' : 'cursor-pointer'}
              onRow={(r) => ({ onClick: () => setModalFisId(r.id) })}
              columns={[
                { title: 'Fiş No', dataIndex: 'irsaliyeNo', width: 110 },
                { title: 'Tarih', dataIndex: 'irsaliyeTarihi', width: 90, render: (v: string | null) => v ? new Date(v).toLocaleDateString('tr-TR') : '-' },
                { title: 'Depo', dataIndex: ['depo', 'ad'], ellipsis: true, render: (_: unknown, rec: MalzemeYonetimFisi) => rec.depo?.ad ?? '-' },
              ]}
            />
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase mb-1">
              Kumaşlar{modalFis ? ` — ${modalFis.irsaliyeNo}` : ''}
            </div>
            <Table<MalzemeYonetimFisiKalem>
              size="small"
              dataSource={(modalFis?.kalemler ?? []).filter((k) => Number(k.netMetre) > 0 || Number(k.brutMetre) > 0)}
              rowKey="id"
              pagination={false}
              scroll={{ y: 300 }}
              loading={modalYukleniyor}
              locale={{ emptyText: modalFisId == null ? 'Önce fiş seçin' : 'Kumaş kalem yok' }}
              columns={[
                { title: 'Kumaş', dataIndex: ['malzeme', 'ad'], ellipsis: true, render: (_: unknown, k: MalzemeYonetimFisiKalem) => k.malzeme?.ad ?? (k.malzemeId != null ? String(k.malzemeId) : '-') },
                { title: 'MT', width: 70, align: 'right', render: (_: unknown, k: MalzemeYonetimFisiKalem) => kalemMT(k).toFixed(1) },
                { title: 'Kalan', width: 70, align: 'right', render: (_: unknown, k: MalzemeYonetimFisiKalem) => {
                  const kalan = Math.max(0, kalemMT(k) - kalemeAyrilan(k.id))
                  return <span className={kalan <= 0 ? 'text-red-500 font-semibold' : 'text-green-600 font-medium'}>{kalan.toFixed(1)}</span>
                } },
                { title: '', width: 60, align: 'center', render: (_: unknown, k: MalzemeYonetimFisiKalem) => (
                  <Button
                    type="link"
                    size="small"
                    disabled={modalFis == null || Math.max(0, kalemMT(k) - kalemeAyrilan(k.id)) <= 0}
                    onClick={() => modalFis && cikisKalemSec(modalFis, k.id)}
                  >
                    Seç
                  </Button>
                ) },
              ]}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

// Gerçek siparişi (kalem→renk→beden) kesim kartının kullandığı normalleştirilmiş yapıya çevirir.
function normalizeSiparis(s: Siparis): SiparisBilgi {
  const kesimFazlasi = s.kesimFazlasi != null ? Number(s.kesimFazlasi) || 0 : 0
  const modeller: ModelBilgi[] = (s.kalemler ?? [])
    .filter((k) => k.malzeme?.kod)
    .map((k) => {
      const renkler: RenkBilgi[] = (k.renkler ?? []).map((r) => {
        const ilkGrup = r.kumasGruplari?.[0]
        const renkKod = ilkGrup?.renk?.kod ?? ilkGrup?.kumasGrup?.kod ?? ''
        const renkAd = ilkGrup?.renk?.ad ?? ''
        return {
          renkAd: renkKod,
          renkLabel: renkKod ? `${renkKod} - ${renkAd}`.replace(/ - $/, '') : renkAd,
          bedenler: (r.bedenler ?? []).map((b) => ({
            beden: b.beden?.kod ?? String(b.bedenId ?? ''),
            miktar: b.miktar != null ? Number(b.miktar) : 0,
          })),
        }
      })
      const kumasGruplari: KumasGrupBilgi[] = []
      const gorulen = new Set<string>()
      for (const r of k.renkler ?? []) {
        for (const g of r.kumasGruplari ?? []) {
          const kumasAd = g.kumasGrup?.kod ?? ''
          const renk = g.renk?.ad ?? g.renk?.kod ?? ''
          const anahtar = `${kumasAd}|${renk}`
          if (gorulen.has(anahtar)) continue
          gorulen.add(anahtar)
          kumasGruplari.push({ kumasAd, renk, gerekliMT: 0, kesimFazlasi })
        }
      }
      return { modelKod: k.malzeme!.kod!, modelAd: k.malzeme?.ad ?? '', kumasGruplari, renkler }
    })
  return { siparisNo: s.siparisNo, modeller }
}
