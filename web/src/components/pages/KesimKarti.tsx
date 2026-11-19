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
  FileTextOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { iadeTalepApi } from '@/lib/iade-talep-api'
import { barkodApi } from '@/lib/barkod-api'
import { malzemeYonetimFisleriApi, type MalzemeYonetimFisi, type MalzemeYonetimFisiKalem } from '@/lib/malzeme-yonetim-fisleri-api'
import { siparisApi, type Siparis } from '@/lib/siparis-api'
import { kesimApi, type Kesim, type KesimForm } from '@/lib/kesim-api'
import { kumasTalepApi, type KumasTalep } from '@/lib/kumas-talep-api'
import { useAuth } from '@/context/AuthContext'
import { useKirli } from '@/lib/kirli'

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
  id: number
  siparisNo: string
  modeller: ModelBilgi[]
}

interface TalepSatir {
  key: string
  kumasKod: string
  kumasAd: string
  renk: string
  miktar: number | null
  birim: string
}

interface KesimKartiProps {
  onKirliChange?: (kirli: boolean) => void
}

export default function KesimKarti({ onKirliChange }: KesimKartiProps) {
  const { message, modal } = App.useApp()
  const { kullanici } = useAuth()
  const [kesimKartlari, setKesimKartlari] = useState<KesimKartiRecord[]>([])
  const [kesimYukleniyor, setKesimYukleniyor] = useState(false)
  const [kaydediyor, setKaydediyor] = useState(false)
  // Kumaş talebi formu (pastal şefi sipariş bazlı talep oluşturur)
  const [talepModalAcik, setTalepModalAcik] = useState(false)
  const [talepSiparisNo, setTalepSiparisNo] = useState('')
  const [talepAciklama, setTalepAciklama] = useState('')
  const [talepNo, setTalepNo] = useState('')
  const [talepSatirlar, setTalepSatirlar] = useState<TalepSatir[]>([])
  const [talepler, setTalepler] = useState<KumasTalep[]>([])
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
  const { kirli, temizle: temizleKirli } = useKirli([
    tarih, seciliSiparis, seciliModel, seciliRenk, kesilenAdetler, fireMiktar, fireOtomatik,
    duzenlenenId, seciliFisId, seciliFisKalemId,
  ])
  useEffect(() => { onKirliChange?.(kirli) }, [kirli, onKirliChange])

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

  const kesimYukle = useCallback(async () => {
    setKesimYukleniyor(true)
    try {
      const liste = await kesimApi.list()
      setKesimKartlari(liste.map(kesimToRecord))
    } catch {
      message.error('Kesim kayıtları yüklenemedi')
    } finally {
      setKesimYukleniyor(false)
    }
  }, [message])

  useEffect(() => {
    kesimYukle()
  }, [kesimYukle])

  const talepListesiYukle = useCallback(async (siparisNo: string) => {
    if (!siparisNo) {
      setTalepler([])
      return
    }
    try {
      setTalepler(await kumasTalepApi.list(siparisNo))
    } catch {
      setTalepler([])
    }
  }, [])

  // Siparişteki model kumaşlarını kumaş+renk bazında tekilleştirip talep satırına çevirir.
  const talepSatirlariYukle = useCallback(
    (siparisNo: string) => {
      const s = siparisler.find((x) => x.siparisNo === siparisNo)
      const gorulen = new Set<string>()
      const satirlar: TalepSatir[] = []
      for (const model of s?.modeller ?? []) {
        for (const g of model.kumasGruplari) {
          const anahtar = `${g.kumasAd}|${g.renk}`
          if (gorulen.has(anahtar)) continue
          gorulen.add(anahtar)
          satirlar.push({ key: anahtar, kumasKod: g.kumasAd, kumasAd: g.kumasAd, renk: g.renk, miktar: null, birim: 'MT' })
        }
      }
      setTalepSatirlar(satirlar)
      talepListesiYukle(siparisNo)
    },
    [siparisler, talepListesiYukle],
  )

  const talepAc = async () => {
    setTalepSiparisNo(seciliSiparis)
    setTalepAciklama('')
    setTalepSatirlar([])
    setTalepler([])
    setTalepModalAcik(true)
    try {
      const { talepNo: no } = await kumasTalepApi.nextNo()
      setTalepNo(no)
    } catch {
      setTalepNo('')
    }
    if (seciliSiparis) talepSatirlariYukle(seciliSiparis)
  }

  const talepKaydet = async () => {
    if (!talepSiparisNo) {
      message.warning('Sipariş seçin')
      return
    }
    const dolu = talepSatirlar.filter((s) => (s.miktar ?? 0) > 0)
    if (dolu.length === 0) {
      message.warning('En az bir kumaş için miktar girin')
      return
    }
    const siparis = siparisler.find((s) => s.siparisNo === talepSiparisNo)
    try {
      await kumasTalepApi.create({
        siparisId: siparis?.id ?? null,
        siparisNo: talepSiparisNo,
        tarih: dayjs().format('YYYY-MM-DD'),
        talepEden: kullanici ? `${kullanici.kod} - ${kullanici.ad}` : null,
        aciklama: talepAciklama || null,
        olusturanKullanici: kullanici?.id ?? null,
        kalemler: dolu.map((s) => ({
          kumasKod: s.kumasKod,
          kumasAd: s.kumasAd,
          renk: s.renk,
          miktar: s.miktar ?? 0,
          birim: s.birim,
        })),
      })
      message.success('Kumaş talebi oluşturuldu')
      setTalepAciklama('')
      setTalepSatirlar((prev) => prev.map((s) => ({ ...s, miktar: null })))
      const { talepNo: no } = await kumasTalepApi.nextNo()
      setTalepNo(no)
      await talepListesiYukle(talepSiparisNo)
    } catch {
      message.error('Kumaş talebi oluşturulamadı')
    }
  }

  const talepSil = (id: number) => {
    modal.confirm({
      title: 'Kumaş talebi silinsin mi?',
      okText: 'Sil',
      okButtonProps: { danger: true },
      cancelText: 'Vazgeç',
      onOk: async () => {
        try {
          await kumasTalepApi.remove(id)
          message.success('Kumaş talebi silindi')
          await talepListesiYukle(talepSiparisNo)
        } catch {
          message.error('Kumaş talebi silinemedi')
        }
      },
    })
  }

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
    temizleKirli()
  }

  const kaydet = async () => {
    if (kaydediyor) return
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
    const ortak = {
      siparisNo: seciliSiparis,
      modelKod: seciliModel,
      modelAd: seciliModelData?.modelAd ?? '',
      renkAd: seciliRenk,
      fireMiktar,
      kumasAd,
      kumasRenk,
      gerekliMiktar: gerekliMT,
      brutMiktar: brutMT,
      kumasMiktar,
      birimTuketim,
      kalanMT,
      fireOrani,
      tarih: tarihStr,
      kaynakFisId: seciliFisId,
      kaynakFisNo: seciliFis?.irsaliyeNo ?? null,
      kaynakKalemId: seciliFisKalemId,
      manuelFire: !fireOtomatik,
      olusturanKullanici: kullanici?.id ?? null,
    }

    setKaydediyor(true)
    try {
      if (duzenlenenId !== null) {
        const g = girisler[0]
        const mevcut = kesimKartlari.find((k) => k.id === duzenlenenId)
        await kesimApi.update(duzenlenenId, {
          ...ortak,
          beden: g.beden,
          planlananMiktar: planlananOf(g.beden),
          kesilenMiktar: g.adet,
          beklenenAdet: beklenenOf(g.beden),
          iadeTalep: mevcut?.iadeTalep ?? false,
          durum: mevcut?.durum ?? 'KESILDI',
        })
        message.success('Kesim kartı güncellendi')
      } else {
        await kesimApi.topluOlustur(
          girisler.map((g) => ({
            ...ortak,
            beden: g.beden,
            planlananMiktar: planlananOf(g.beden),
            kesilenMiktar: g.adet,
            beklenenAdet: beklenenOf(g.beden),
            iadeTalep: false,
            durum: 'KESILDI',
          })),
        )
        message.success(`${girisler.length} beden kesildi`)
      }
      await kesimYukle()
      temizle()
    } catch {
      message.error('Kesim kaydedilemedi')
    } finally {
      setKaydediyor(false)
    }
  }

  const dikimeGonder = async (id: number) => {
    const kart = kesimKartlari.find((k) => k.id === id)
    if (!kart) return
    try {
      await kesimApi.update(id, { ...recordToForm(kart), durum: 'DIKIME_GONDERILDI' })
      message.success('Dikime gönderildi')
      await kesimYukle()
    } catch {
      message.error('Dikime gönderilemedi')
    }
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
      await kesimApi.update(id, { ...recordToForm(kart), iadeTalep: true })
      message.success('İade talebi oluşturuldu')
      await kesimYukle()
    } catch {
      message.error('İade talebi oluşturulurken hata oluştu')
    }
  }

  const fireOlarakKaydet = async (id: number) => {
    const kart = kesimKartlari.find((k) => k.id === id)
    if (!kart) return
    const yeniFireMiktar = kart.fireMiktar + kart.kalanMT
    const yeniFireOrani = kart.kumasMiktar > 0 ? (yeniFireMiktar / kart.kumasMiktar) * 100 : 0
    try {
      await kesimApi.update(id, {
        ...recordToForm(kart),
        fireMiktar: yeniFireMiktar,
        kalanMT: 0,
        fireOrani: yeniFireOrani,
      })
      message.info('Kalan kumaş fire olarak kaydedildi')
      await kesimYukle()
    } catch {
      message.error('Fire kaydedilemedi')
    }
  }

  const kesimSil = (id: number) => {
    const kart = kesimKartlari.find((k) => k.id === id)
    modal.confirm({
      title: 'Kesim kaydı silinsin mi?',
      content: kart ? `${kart.siparisNo} / ${kart.modelKod} / ${kart.renkAd} / ${kart.beden}` : undefined,
      okText: 'Sil',
      okButtonProps: { danger: true },
      cancelText: 'Vazgeç',
      onOk: async () => {
        try {
          await kesimApi.remove(id)
          message.success('Kesim kaydı silindi')
          await kesimYukle()
        } catch {
          message.error('Kesim kaydı silinemedi')
        }
      },
    })
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
              temizleKirli()
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
          {
            key: 'sil',
            label: 'Sil',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => kesimSil(record.id),
          },
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
        <Button
          size="small"
          icon={<FileTextOutlined />}
          onClick={talepAc}
          className="!ml-auto !text-[11px]"
        >
          Kumaş Talebi
        </Button>
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
          loading={kesimYukleniyor}
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

      {/* Sipariş bazlı kumaş talebi formu */}
      <Modal
        title="Kumaş Talebi"
        open={talepModalAcik}
        onCancel={() => setTalepModalAcik(false)}
        footer={null}
        width={900}
      >
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <div className="text-[9px] text-gray-400 mb-0.5 uppercase">Sipariş</div>
              <Select
                className="!w-full"
                size="small"
                placeholder="Sipariş seçin"
                value={talepSiparisNo || undefined}
                onChange={(v) => {
                  setTalepSiparisNo(v)
                  talepSatirlariYukle(v)
                }}
                options={siparisler.map((s) => ({ label: s.siparisNo, value: s.siparisNo }))}
              />
            </div>
            <div>
              <div className="text-[9px] text-gray-400 mb-0.5 uppercase">Talep No</div>
              <div className="text-[12px] font-semibold text-gray-700 leading-6">{talepNo || '—'}</div>
            </div>
            <div>
              <div className="text-[9px] text-gray-400 mb-0.5 uppercase">Tarih</div>
              <div className="text-[12px] font-semibold text-gray-700 leading-6">{dayjs().format('DD.MM.YYYY')}</div>
            </div>
          </div>

          <Input.TextArea
            rows={2}
            placeholder="Açıklama"
            value={talepAciklama}
            onChange={(e) => setTalepAciklama(e.target.value)}
          />

          <Table<TalepSatir>
            size="small"
            dataSource={talepSatirlar}
            rowKey="key"
            pagination={false}
            scroll={{ y: 220 }}
            locale={{ emptyText: 'Sipariş seçince model kumaşları listelenir' }}
            columns={[
              { title: 'Kumaş', dataIndex: 'kumasAd', ellipsis: true },
              { title: 'Renk', dataIndex: 'renk', width: 120 },
              {
                title: 'Miktar',
                width: 110,
                render: (_: unknown, r: TalepSatir) => (
                  <InputNumber
                    size="small"
                    className="!w-full"
                    min={0}
                    value={r.miktar ?? undefined}
                    onChange={(v) =>
                      setTalepSatirlar((prev) => prev.map((x) => (x.key === r.key ? { ...x, miktar: v } : x)))
                    }
                  />
                ),
              },
              { title: 'Birim', dataIndex: 'birim', width: 70 },
            ]}
          />

          <div className="flex justify-end gap-2">
            <Button size="small" onClick={() => setTalepModalAcik(false)}>
              Kapat
            </Button>
            <Button size="small" type="primary" onClick={talepKaydet}>
              Talebi Kaydet
            </Button>
          </div>

          <div className="text-[10px] text-gray-500 uppercase mt-1">Bu siparişin talepleri</div>
          <Table<KumasTalep>
            size="small"
            dataSource={talepler}
            rowKey="id"
            pagination={false}
            scroll={{ y: 160 }}
            locale={{ emptyText: 'Talep yok' }}
            columns={[
              { title: 'Talep No', dataIndex: 'talepNo', width: 130 },
              {
                title: 'Tarih',
                dataIndex: 'tarih',
                width: 100,
                render: (v: string) => (v ? new Date(v).toLocaleDateString('tr-TR') : '—'),
              },
              {
                title: 'Kalemler',
                ellipsis: true,
                render: (_: unknown, t: KumasTalep) =>
                  (t.kalemler ?? [])
                    .map((k) => `${k.kumasAd || k.kumasKod}${k.renk ? ' / ' + k.renk : ''} ${Number(k.miktar)} ${k.birim}`)
                    .join(', '),
              },
              {
                title: '',
                width: 60,
                align: 'center',
                render: (_: unknown, t: KumasTalep) => (
                  <Button type="link" size="small" danger onClick={() => talepSil(t.id)}>
                    Sil
                  </Button>
                ),
              },
            ]}
          />
        </div>
      </Modal>
    </div>
  )
}

// API kaydını ekranın satır modeline çevirir (Prisma Decimal değerleri metin gelir).
function kesimToRecord(k: Kesim): KesimKartiRecord {
  return {
    id: k.id,
    siparisNo: k.siparisNo,
    modelKod: k.modelKod,
    modelAd: k.modelAd ?? '',
    renkAd: k.renkAd,
    beden: k.beden,
    planlananMiktar: Number(k.planlananMiktar) || 0,
    kesilenMiktar: Number(k.kesilenMiktar) || 0,
    fireMiktar: Number(k.fireMiktar) || 0,
    kumasAd: k.kumasAd ?? '',
    kumasRenk: k.kumasRenk ?? '',
    gerekliMiktar: Number(k.gerekliMiktar) || 0,
    brutMiktar: Number(k.brutMiktar) || 0,
    kumasMiktar: Number(k.kumasMiktar) || 0,
    birimTuketim: Number(k.birimTuketim) || 0,
    beklenenAdet: Number(k.beklenenAdet) || 0,
    kalanMT: Number(k.kalanMT) || 0,
    fireOrani: Number(k.fireOrani) || 0,
    iadeTalep: !!k.iadeTalep,
    tarih: k.tarih,
    durum: k.durum === 'DIKIME_GONDERILDI' ? 'DIKIME_GONDERILDI' : 'KESILDI',
    kaynakFisId: k.kaynakFisId ?? null,
    kaynakFisNo: k.kaynakFisNo ?? null,
    kaynakKalemId: k.kaynakKalemId ?? null,
    manuelFire: !!k.manuelFire,
  }
}

function recordToForm(k: KesimKartiRecord): KesimForm {
  return {
    siparisNo: k.siparisNo,
    modelKod: k.modelKod,
    modelAd: k.modelAd,
    renkAd: k.renkAd,
    beden: k.beden,
    planlananMiktar: k.planlananMiktar,
    kesilenMiktar: k.kesilenMiktar,
    fireMiktar: k.fireMiktar,
    kumasAd: k.kumasAd,
    kumasRenk: k.kumasRenk,
    gerekliMiktar: k.gerekliMiktar,
    brutMiktar: k.brutMiktar,
    kumasMiktar: k.kumasMiktar,
    birimTuketim: k.birimTuketim,
    beklenenAdet: k.beklenenAdet,
    kalanMT: k.kalanMT,
    fireOrani: k.fireOrani,
    iadeTalep: k.iadeTalep,
    tarih: k.tarih,
    durum: k.durum,
    kaynakFisId: k.kaynakFisId ?? null,
    kaynakFisNo: k.kaynakFisNo ?? null,
    kaynakKalemId: k.kaynakKalemId ?? null,
    manuelFire: k.manuelFire,
  }
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
  return { id: s.id, siparisNo: s.siparisNo, modeller }
}
