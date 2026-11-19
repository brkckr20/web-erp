'use client'

import { Input, InputNumber, App, Dropdown, Modal, Table, Button } from 'antd'
import type { MenuProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ReloadOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  ApartmentOutlined,
  ExportOutlined,
  ProfileOutlined,
  BgColorsOutlined,
  WarningOutlined,
  BankOutlined,
  LinkOutlined,
  DisconnectOutlined,
  FileAddOutlined,
} from '@ant-design/icons'
import { useCallback, useState, useMemo, useEffect, useRef } from 'react'
import type { ColDef, CellContextMenuEvent } from 'ag-grid-community'
import DataGrid, { DataGridHandle } from '@/components/shared/DataGrid'
import {
  tedarikApi,
  type KumasPlanlamaSatir,
  type KumasHareketSatiri,
  type KarsilamaDepoSatir,
  type TahsisKaynakSatir,
  type TahsisSatir,
} from '@/lib/tedarik-api'
import { fasonTipiApi, parseKategoriler, type FasonTipi } from '@/lib/fason-tipi-api'
import { isEmriApi } from '@/lib/is-emri-api'
import type { IrsaliyeBaslangicKalem } from '@/components/pages/IrsaliyeKarti'
import type { StokFisiBaslangicKalem } from '@/data/modules'
import { baslangicKalemleriBirlestir, baslangicKalemleriKumule } from '@/components/pages/IrsaliyeKarti'

const fisTipiAdlari: Record<string, string> = {
  '1': 'Mal Alım İrsaliyesi',
  '5': 'Konsinye Giriş İrsaliyesi',
  '6': 'Fasona Giriş İrsaliyesi',
  '9': 'Müstahsil İrsaliyesi',
  '11': 'Fasondan Giriş İrsaliyesi',
  '22': 'Alınan Hizmet İrsaliyesi',
  '122': 'Mal Alım İade İrsaliyesi',
  '133': 'Fasona Giriş İade İrsaliyesi',
  '201': 'Satın Alma Siparişi',
  '202': 'Fason Talimat Fişi',
}

const f3 = (v: number) =>
  Number(v || 0).toLocaleString('tr-TR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })

// Kaynak seçimi başlangıcı: malzeme ihtiyacı kadar, fiş sırasına göre (FIFO)
// kaynak satırları doldurulur. Kullanıcı miktarları değiştirebilir.
const varsayilanTahsisSecimi = (
  hedefler: KumasPlanlamaSatir[],
  kaynaklar: TahsisKaynakSatir[],
): Record<number, number> => {
  const ihtiyac = new Map<number, number>()
  for (const h of hedefler) {
    const malzemeId = h.malzemeId as number
    ihtiyac.set(malzemeId, (ihtiyac.get(malzemeId) ?? 0) + (Number(h.acikMiktar) || 0))
  }
  const secimler: Record<number, number> = {}
  for (const k of kaynaklar) {
    const kalanIhtiyac = ihtiyac.get(k.malzemeId) ?? 0
    if (kalanIhtiyac <= 0.00005) continue
    const miktar = Number(Math.min(k.kalan, kalanIhtiyac).toFixed(3))
    if (miktar <= 0.00005) continue
    secimler[k.irsaliyeKalemId] = miktar
    ihtiyac.set(k.malzemeId, kalanIhtiyac - miktar)
  }
  return secimler
}

export default function KumasPlanlama({ onYeniSatinalmaSiparis, onFasonTalimat, onIsEmriAc, onUretimeCikis }: {
  onYeniSatinalmaSiparis?: (kalemler: IrsaliyeBaslangicKalem[]) => void
  /** Fason Talimatı (202) açar; fasonId fiş alt tipi olarak gelir. */
  onFasonTalimat?: (fasonTipiId: number, kalemler: IrsaliyeBaslangicKalem[]) => void
  /** Oluşturulan iş emrini kart sekmesinde açar. */
  onIsEmriAc?: (isEmriNo: string) => void
  /** Seçili planlama satırlarıyla 140-Üretime Çıkış Fişi açar. */
  onUretimeCikis?: (kalemler: StokFisiBaslangicKalem[]) => void
}) {
  const [satirlar, setSatirlar] = useState<KumasPlanlamaSatir[]>([])
  const [arama, setArama] = useState('')
  const [fasonTipleri, setFasonTipleri] = useState<FasonTipi[]>([])
  const { message, modal } = App.useApp()
  const gridRef = useRef<DataGridHandle>(null)
  const [hareketSatir, setHareketSatir] = useState<KumasPlanlamaSatir | null>(null)
  const [hareketler, setHareketler] = useState<KumasHareketSatiri[]>([])
  const [hareketLoading, setHareketLoading] = useState(false)
  const [karsilamaSatir, setKarsilamaSatir] = useState<KumasPlanlamaSatir | null>(null)
  const [karsilamaDepo, setKarsilamaDepo] = useState<KarsilamaDepoSatir[]>([])
  const [karsilamaLoading, setKarsilamaLoading] = useState(false)
  const [guncelleniyor, setGuncelleniyor] = useState(false)
  const [kaynakPlan, setKaynakPlan] = useState<{
    hedefler: KumasPlanlamaSatir[]
    kaynaklar: TahsisKaynakSatir[]
    secimler: Record<number, number>
  } | null>(null)
  const [kaynakYukleniyor, setKaynakYukleniyor] = useState(false)
  const [tahsisKaydediyor, setTahsisKaydediyor] = useState(false)
  const [isEmriOlusturuyor, setIsEmriOlusturuyor] = useState(false)

  const hareketAc = useCallback((r: KumasPlanlamaSatir) => {
    setHareketSatir(r)
    setHareketler([])
    setHareketLoading(true)
    tedarikApi
      .planlamaKumasHareketler(r.siparisNo, r.malzemeKod, r.siparisKalemId ?? null, r.varyant1RenkId ?? null)
      .then(setHareketler)
      .catch((err: unknown) =>
        message.error('Hareketler yüklenemedi: ' + (err instanceof Error ? err.message : String(err))),
      )
      .finally(() => setHareketLoading(false))
  }, [message])

  // Satırın serbest stok karşılaması: hangi depoda ne kadar renkli/ham var.
  const karsilamaAc = useCallback((r: KumasPlanlamaSatir) => {
    setKarsilamaSatir(r)
    setKarsilamaDepo([])
    setKarsilamaLoading(true)
    tedarikApi
      .karsilamaDepo(r.malzemeKod, r.varyant1, r.malzemeId)
      .then(setKarsilamaDepo)
      .catch((err: unknown) =>
        message.error('Depo stokları yüklenemedi: ' + (err instanceof Error ? err.message : String(err))),
      )
      .finally(() => setKarsilamaLoading(false))
  }, [message])

  const karsilamaColumns = useMemo<ColumnsType<KarsilamaDepoSatir>>(() => {
    const birim = (karsilamaSatir?.birim || '').toLowerCase()
    const renkliAlan = birim.includes('kg') ? 'renkliKg' : birim.includes('adet') ? 'renkliAdet' : 'renkliMt'
    const hamAlan = birim.includes('kg') ? 'hamKg' : birim.includes('adet') ? 'hamAdet' : 'hamMt'
    const fmt = (v: number) =>
      Number(v).toLocaleString('tr-TR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
    return [
      { title: 'Depo', dataIndex: 'depoAd', ellipsis: true, render: (_: unknown, r) => `${r.depoKod} - ${r.depoAd}` },
      { title: 'Renkli Stok', dataIndex: renkliAlan, width: 140, align: 'right', render: (v: number) => fmt(v) },
      { title: 'Ham Stok', dataIndex: hamAlan, width: 140, align: 'right', render: (v: number) => fmt(v) },
    ]
  }, [karsilamaSatir])

  const hareketColumns = useMemo<ColumnsType<KumasHareketSatiri>>(() => [
    {
      title: 'Fiş No',
      dataIndex: 'fisNo',
      width: 130,
    },
    {
      title: 'Fiş Tipi',
      dataIndex: 'fisTipi',
      width: 200,
      ellipsis: true,
      render: (v: string) => (fisTipiAdlari[v] ? `${v} - ${fisTipiAdlari[v]}` : v),
    },
    {
      title: 'Tarih',
      dataIndex: 'fisTarihi',
      width: 100,
      render: (v: string) => (v ? new Date(v).toLocaleDateString('tr-TR') : ''),
    },
    ...(['brutKg', 'kg', 'brutMt', 'mt', 'adet'] as const).map((alan) => ({
      title: alan === 'brutKg' ? 'Brüt Kg' : alan === 'kg' ? 'Kg' : alan === 'brutMt' ? 'Brüt Mt' : alan === 'mt' ? 'Mt' : 'Adet',
      dataIndex: alan,
      width: 100,
      align: 'right' as const,
      render: (v: number | null) =>
        v == null ? '' : Number(v).toLocaleString('tr-TR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
    })),
    {
      title: 'Tahsis',
      dataIndex: 'tahsisMiktar',
      width: 110,
      align: 'right' as const,
      render: (v: number) =>
        Number(v || 0).toLocaleString('tr-TR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
    },
    {
      title: 'Depo',
      dataIndex: 'depoAd',
      width: 140,
      ellipsis: true,
    },
    {
      title: 'Cari',
      dataIndex: 'cariAd',
      width: 160,
      ellipsis: true,
    },
    {
      title: 'Açıklama',
      dataIndex: 'aciklama',
      ellipsis: true,
    },
  ], [])

  const load = useCallback(() => {
    return tedarikApi
      .planlamaKumas()
      .then(setSatirlar)
      .catch((err: unknown) =>
        message.error('Veriler yüklenemedi: ' + (err instanceof Error ? err.message : String(err))),
      )
  }, [message])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    fasonTipiApi
      .list()
      .then(setFasonTipleri)
      .catch(() => setFasonTipleri([]))
  }, [])

  const filtrelenmis = useMemo(() => {
    const q = arama.trim().toLowerCase()
    if (!q) return satirlar
    return satirlar.filter(
      (r) =>
        r.siparisNo.toLowerCase().includes(q) ||
        (r.modelKod ?? '').toLowerCase().includes(q) ||
        (r.modelAd ?? '').toLowerCase().includes(q) ||
        (r.musteriAd ?? '').toLowerCase().includes(q) ||
        r.malzemeKod.toLowerCase().includes(q) ||
        r.malzemeAd.toLowerCase().includes(q) ||
        (r.islem ?? '').toLowerCase().includes(q) ||
        r.varyant1.toLowerCase().includes(q) ||
        r.varyant1Aciklama.toLowerCase().includes(q),
    )
  }, [satirlar, arama])

  const bayatSatirlar = useMemo(() => filtrelenmis.filter((r) => r.guncelMi === false), [filtrelenmis])
  const bayatSiparisSayisi = useMemo(
    () => new Set(bayatSatirlar.map((r) => r.siparisNo)).size,
    [bayatSatirlar],
  )

  // Kaynak seçim özeti: malzeme bazında ihtiyaç ve seçilen kaynak miktarı.
  const kaynakOzet = useMemo(() => {
    if (!kaynakPlan) return null
    const ihtiyac = new Map<number, { kod: string; ad: string; birim: string; toplam: number }>()
    for (const h of kaynakPlan.hedefler) {
      const malzemeId = h.malzemeId as number
      const mevcut = ihtiyac.get(malzemeId) ?? {
        kod: h.malzemeKod,
        ad: h.malzemeAd,
        birim: h.birim,
        toplam: 0,
      }
      mevcut.toplam += Number(h.acikMiktar) || 0
      ihtiyac.set(malzemeId, mevcut)
    }
    const secilen = new Map<number, number>()
    for (const k of kaynakPlan.kaynaklar) {
      const miktar = Number(kaynakPlan.secimler[k.irsaliyeKalemId]) || 0
      if (miktar > 0.00005) secilen.set(k.malzemeId, (secilen.get(k.malzemeId) ?? 0) + miktar)
    }
    const malzemeler = [...ihtiyac.entries()].map(([malzemeId, v]) => ({
      malzemeId,
      kod: v.kod,
      ad: v.ad,
      birim: v.birim,
      ihtiyac: Number(v.toplam.toFixed(3)),
      secilen: Number((secilen.get(malzemeId) ?? 0).toFixed(3)),
    }))
    return {
      malzemeler,
      secilenToplam: malzemeler.reduce((acc, m) => acc + m.secilen, 0),
      acikToplam: malzemeler.reduce((acc, m) => acc + Math.max(0, m.ihtiyac - m.secilen), 0),
      birim: malzemeler.length === 1 ? malzemeler[0]?.birim ?? '' : '',
    }
  }, [kaynakPlan])

  // Bir kaynak satırda kullanılabilecek en fazla miktar: satırın kalanı ve
  // malzemenin diğer seçimlerden artan ihtiyacı.
  const kaynakEnFazla = (k: TahsisKaynakSatir) => {
    if (!kaynakPlan) return 0
    const ihtiyac = kaynakPlan.hedefler
      .filter((h) => h.malzemeId === k.malzemeId)
      .reduce((acc, h) => acc + (Number(h.acikMiktar) || 0), 0)
    const digerleri = kaynakPlan.kaynaklar
      .filter((x) => x.malzemeId === k.malzemeId && x.irsaliyeKalemId !== k.irsaliyeKalemId)
      .reduce((acc, x) => acc + (Number(kaynakPlan.secimler[x.irsaliyeKalemId]) || 0), 0)
    return Number(Math.min(k.kalan, Math.max(0, ihtiyac - digerleri)).toFixed(3))
  }

  const kaynakSecimDegistir = (k: TahsisKaynakSatir, deger: number, enFazla: number) => {
    setKaynakPlan((p) => {
      if (!p) return p
      const miktar = Number(Math.min(Math.max(0, Number(deger) || 0), enFazla).toFixed(3))
      const secimler = { ...p.secimler }
      if (miktar > 0.00005) secimler[k.irsaliyeKalemId] = miktar
      else delete secimler[k.irsaliyeKalemId]
      return { ...p, secimler }
    })
  }

  const kaynakOneriUygula = () =>
    setKaynakPlan((p) => (p ? { ...p, secimler: varsayilanTahsisSecimi(p.hedefler, p.kaynaklar) } : p))

  const kaynakSecimiAc = async (hedefler: KumasPlanlamaSatir[]) => {
    setKaynakPlan({ hedefler, kaynaklar: [], secimler: {} })
    setKaynakYukleniyor(true)
    try {
      const malzemeler = [
        ...new Map(hedefler.map((r) => [r.malzemeId as number, r.birim || ''])).entries(),
      ].map(([malzemeId, birim]) => ({ malzemeId, birim }))
      const kaynaklar = await tedarikApi.tahsisKaynaklari(malzemeler)
      setKaynakPlan({
        hedefler,
        kaynaklar,
        secimler: varsayilanTahsisSecimi(hedefler, kaynaklar),
      })
    } catch (err) {
      setKaynakPlan(null)
      message.error(
        'Ham stok kaynakları yüklenemedi: ' + (err instanceof Error ? err.message : String(err)),
      )
    } finally {
      setKaynakYukleniyor(false)
    }
  }

  const kaynakTahsisKaydet = async () => {
    if (!kaynakPlan || !kaynakOzet) return
    const secilenler = kaynakPlan.kaynaklar
      .map((k) => ({
        kaynak: k,
        secilen: Number(kaynakPlan.secimler[k.irsaliyeKalemId]) || 0,
        kalanKaynak: k.kalan,
      }))
      .filter((x) => x.secilen > 0.00005)
    if (secilenler.length === 0) {
      message.warning('Tahsis için kaynak miktarı seçilmedi')
      return
    }

    // Seçilen kaynaklar malzeme bazında hedef satırlara sırayla dağıtılır.
    const satirlar: TahsisSatir[] = []
    for (const r of kaynakPlan.hedefler) {
      const malzemeId = r.malzemeId as number
      let kalanIhtiyac = Number(r.acikMiktar) || 0
      if (kalanIhtiyac <= 0.00005) continue
      const kaynaklar: { irsaliyeKalemId: number; miktar: number }[] = []
      for (const s of secilenler) {
        if (s.kaynak.malzemeId !== malzemeId || s.kalanKaynak <= 0.00005) continue
        const pay = Number(Math.min(kalanIhtiyac, s.secilen, s.kalanKaynak).toFixed(3))
        if (pay <= 0.00005) continue
        kaynaklar.push({ irsaliyeKalemId: s.kaynak.irsaliyeKalemId, miktar: pay })
        s.secilen = Number((s.secilen - pay).toFixed(3))
        s.kalanKaynak = Number((s.kalanKaynak - pay).toFixed(3))
        kalanIhtiyac = Number((kalanIhtiyac - pay).toFixed(3))
        if (kalanIhtiyac <= 0.00005) break
      }
      if (kaynaklar.length === 0) continue
      satirlar.push({
        siparisKalemId: r.siparisKalemId as number,
        siparisNo: r.siparisNo,
        modelKod: r.modelKod,
        malzemeId,
        renkId: r.varyant1RenkId ?? null,
        birim: r.birim,
        miktar: Number(kaynaklar.reduce((acc, k) => acc + k.miktar, 0).toFixed(3)),
        kaynaklar,
      })
    }
    if (satirlar.length === 0) {
      message.warning('Tahsis edilecek miktar yok')
      return
    }

    const birimEki = kaynakOzet.birim ? ` ${kaynakOzet.birim}` : ''
    setTahsisKaydediyor(true)
    try {
      const sonuc = await tedarikApi.tahsisEt(satirlar)
      const toplam = sonuc.satirlar.reduce((acc, s) => acc + s.tahsisEdilen, 0)
      const acik = sonuc.satirlar.reduce((acc, s) => acc + s.kalan, 0)
      setKaynakPlan(null)
      await load()
      if (acik > 0.00005) {
        message.warning(`${f3(toplam)}${birimEki} tahsis edildi · ${f3(acik)}${birimEki} açık kaldı`)
      } else {
        message.success(`${f3(toplam)}${birimEki} tahsis edildi`)
      }
    } catch (err) {
      message.error('Tahsis yapılamadı: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setTahsisKaydediyor(false)
    }
  }

  const kaynakColumns: ColumnsType<TahsisKaynakSatir> = [
    {
      title: 'Malzeme',
      dataIndex: 'malzemeKod',
      ellipsis: true,
      render: (_: unknown, r) => `${r.malzemeKod} - ${r.malzemeAd}`,
    },
    { title: 'Fiş No', dataIndex: 'fisNo', width: 110 },
    {
      title: 'Tarih',
      dataIndex: 'fisTarihi',
      width: 95,
      render: (v: string | null) => (v ? new Date(v).toLocaleDateString('tr-TR') : ''),
    },
    { title: 'Depo', dataIndex: 'depoAd', width: 110, ellipsis: true },
    { title: 'Cari', dataIndex: 'cariAd', width: 130, ellipsis: true },
    { title: 'Miktar', dataIndex: 'miktar', width: 90, align: 'right', render: (v: number) => f3(v) },
    { title: 'Tahsisli', dataIndex: 'tahsisli', width: 90, align: 'right', render: (v: number) => f3(v) },
    { title: 'Kalan', dataIndex: 'kalan', width: 90, align: 'right', render: (v: number) => f3(v) },
    {
      title: 'Kullanılacak',
      key: 'secim',
      width: 120,
      align: 'right',
      render: (_: unknown, r) => {
        const enFazla = kaynakEnFazla(r)
        return (
          <InputNumber
            size="small"
            min={0}
            max={enFazla}
            step={0.001}
            precision={3}
            value={kaynakPlan?.secimler[r.irsaliyeKalemId] ?? 0}
            onChange={(v) => kaynakSecimDegistir(r, Number(v ?? 0), enFazla)}
            style={{ width: 104 }}
          />
        )
      },
    },
  ]

  const bayatlariGuncelle = useCallback(() => {
    modal.confirm({
      title: 'Bayat tedarik hesapları güncellensin mi?',
      content: `${bayatSatirlar.length} satır (${bayatSiparisSayisi} sipariş) güncel sipariş bilgilerine göre yeniden hesaplanacak.`,
      okText: 'Yeniden Hesapla',
      cancelText: 'Vazgeç',
      onOk: async () => {
        setGuncelleniyor(true)
        try {
          const sonuc = await tedarikApi.guncelleBayatlar()
          await load()
          if (sonuc.hataSayisi > 0) {
            message.warning(
              `${sonuc.guncellenen} kalem güncellendi, ${sonuc.hataSayisi} kalemde hata oluştu`,
            )
          } else {
            message.success(`${sonuc.guncellenen} kalemin tedarik hesabı güncellendi`)
          }
        } catch (err) {
          message.error(
            'Hesaplama yapılamadı: ' + (err instanceof Error ? err.message : String(err)),
          )
        } finally {
          setGuncelleniyor(false)
        }
      },
    })
  }, [bayatSatirlar.length, bayatSiparisSayisi, load, message, modal])

  const columns = useMemo<ColDef<KumasPlanlamaSatir>[]>(() => [
    { headerName: 'Sipariş No', field: 'siparisNo', width: 110, resizable: true },
    {
      headerName: 'Model Kodu - Adı',
      width: 200,
      resizable: true,
      flex: 1,
      minWidth: 160,
      valueGetter: (p) => [p.data?.modelKod, p.data?.modelAd].filter(Boolean).join(' - ') || '',
    },
    {
      headerName: 'Sipariş Miktarı',
      field: 'siparisMiktar',
      width: 110,
      type: 'rightAligned',
      resizable: true,
      valueFormatter: (p) => Number(p.value).toLocaleString('tr-TR', { maximumFractionDigits: 2 }),
    },
    { headerName: 'Müşteri Adı', field: 'musteriAd', width: 180, resizable: true },
    { headerName: 'Malzeme Kodu', field: 'malzemeKod', width: 130, resizable: true },
    { headerName: 'Malzeme Adı', field: 'malzemeAd', width: 160, resizable: true },
    { headerName: 'İşlem', field: 'islem', width: 140, resizable: true },
    { headerName: 'Varyant-1', field: 'varyant1', width: 190, resizable: true },
    { headerName: 'Varyant-1 Açıklama', field: 'varyant1Aciklama', width: 190, resizable: true },
    {
      headerName: 'Gereken Miktar',
      field: 'gerekenMiktar',
      width: 120,
      type: 'rightAligned',
      resizable: true,
      valueFormatter: (p) =>
        Number(p.value).toLocaleString('tr-TR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
    },
    {
      headerName: 'Renkli Stok',
      field: 'renkliStok',
      width: 110,
      type: 'rightAligned',
      resizable: true,
      valueFormatter: (p) =>
        Number(p.value).toLocaleString('tr-TR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
    },
    {
      headerName: 'Ham Stok',
      field: 'hamStok',
      width: 110,
      type: 'rightAligned',
      resizable: true,
      valueFormatter: (p) =>
        Number(p.value).toLocaleString('tr-TR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
      cellStyle: (p) => (Number(p.value) < 0 ? { backgroundColor: '#fee2e2', color: '#991b1b', fontWeight: 600 } : undefined),
    },
    {
      headerName: 'Tahsis Edilen',
      field: 'tahsisEdilen',
      width: 115,
      type: 'rightAligned',
      resizable: true,
      valueFormatter: (p) =>
        Number(p.value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
    },
    {
      headerName: 'Free Stok',
      field: 'freeStok',
      width: 110,
      type: 'rightAligned',
      resizable: true,
      valueFormatter: (p) =>
        Number(p.value).toLocaleString('tr-TR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
      cellStyle: (p) => (Number(p.value || 0) > 0 ? { backgroundColor: '#cffafe', color: '#155e75', fontWeight: 600 } : undefined),
    },
    {
      headerName: 'Boya Giden',
      field: 'boyaGiden',
      width: 110,
      type: 'rightAligned',
      resizable: true,
      valueFormatter: (p) =>
        Number(p.value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
      cellStyle: (p) => (Number(p.value || 0) > 0 ? { backgroundColor: '#ede9fe', color: '#5b21b6', fontWeight: 600 } : undefined),
    },
    {
      headerName: 'Açık',
      field: 'acikMiktar',
      width: 110,
      type: 'rightAligned',
      resizable: true,
      valueFormatter: (p) =>
        Number(p.value).toLocaleString('tr-TR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
    },
    {
      headerName: 'Öneri',
      width: 150,
      resizable: true,
      valueGetter: (p) =>
        p.data?.oneri === 'STOK'
          ? 'Stoktan Karşıla'
          : p.data?.oneri === 'BOYADA'
            ? 'Boyada Bekliyor'
            : p.data?.oneri === 'HAM_BOYA'
              ? 'Hamı Boyaya Gönder'
              : p.data?.oneri === 'FREE_TAHSIS'
                ? 'Free Stoktan Tahsis Et'
                : 'Temin Gerekli',
      cellStyle: (p) => {
        if (p.data?.oneri === 'STOK') return { backgroundColor: '#dcfce7', color: '#166534', fontWeight: 600 }
        if (p.data?.oneri === 'BOYADA') return { backgroundColor: '#ede9fe', color: '#5b21b6', fontWeight: 600 }
        if (p.data?.oneri === 'HAM_BOYA') return { backgroundColor: '#ffedd5', color: '#9a3412', fontWeight: 600 }
        if (p.data?.oneri === 'FREE_TAHSIS') return { backgroundColor: '#cffafe', color: '#155e75', fontWeight: 600 }
        return { backgroundColor: '#fee2e2', color: '#991b1b', fontWeight: 600 }
      },
    },
  ], [])
  const sorguMetni = arama.trim() ? ` - "${arama.trim()}"` : ''

  const contextMenuItems: MenuProps['items'] = [
    {
      key: 'satinalma',
      label: 'Satın Alma Siparişi Oluştur',
      icon: <ShoppingCartOutlined />,
      children: [
        { key: 'satinalma:satir', label: 'Satır Satır' },
        { key: 'satinalma:birlesik', label: 'Birleştirilmiş' },
      ],
    },
    { key: 'ham-satinalma-talimat', label: 'Ham Satın Alma Siparişi Oluştur', icon: <ShoppingCartOutlined /> },
    { key: 'mal-alim-irsaliye', label: 'Mal Alım İrsaliyesi Oluştur', icon: <InboxOutlined /> },
    {
      key: 'fason',
      label: 'Fason İşlemleri',
      icon: <ApartmentOutlined />,
      children: fasonTipleri
        .filter((f) => parseKategoriler(f.kategoriler).includes('kumas'))
        .map((f) => ({
          key: `fason:${f.id}`,
          label: f.ad,
          children: [
            { key: `fason:${f.id}:satir`, label: 'Satır Satır' },
            { key: `fason:${f.id}:birlesik`, label: 'Birleştirilmiş' },
          ],
        })),
    },
    { key: 'is-emri-olustur', label: 'İş Emri Oluştur', icon: <FileAddOutlined />, disabled: isEmriOlusturuyor },
    { key: 'uretime-cikis', label: 'Üretime Çıkış Fişi Oluştur', icon: <ExportOutlined /> },
    { key: 'depo-stok', label: 'Depo Stok Kırılımı (Renkli/Ham)', icon: <BankOutlined /> },
    { type: 'divider' },
    { key: 'tahsis-et', label: 'İhtiyaç Miktarı Kadar Tahsis Et', icon: <LinkOutlined /> },
    { key: 'tahsis-kaldir', label: 'Tahsisleri Kaldır', icon: <DisconnectOutlined /> },
    { key: 'hareket-detaylari', label: 'Hareket Detayları', icon: <ProfileOutlined /> },
    { key: 'renkler', label: 'Renkler', icon: <BgColorsOutlined /> },
  ]

  // Seçili planlama satırlarını fason/satın alma fiş kalemlerine çevirir.
  // Aynı kumaş + renkteki satırlar tek kalemde birleşir (miktar toplanır);
  // kaynaklar tahsis listesinde saklanır (202 satırında sağ tık -> Tahsis Detayları).
  // varyant1 = sipariş kumaş rengi, 202-Fason Talimatı'nda görünür (planlama bilgisi);
  // 134'e aktarılırken düşer -> çıkış ham/varyantsız, 11 girişinde boyahane kartı seçilir.
  const satirlariKalemeCevir = (satirlar: KumasPlanlamaSatir[]): IrsaliyeBaslangicKalem[] => {
    const kalemler = satirlar.map((r) => {
      const renkliStok = Number(r.renkliStok) || 0
      const boyaGiden = Number(r.boyaGiden) || 0
      // Satıra düşen ham stok payı (malzeme havuzundan gereken oranıyla).
      const hamPay = Number(r.hamPay ?? r.hamStok) || 0
      const gereken = Number(r.gerekenMiktar) || 0
      // Fason'a gönderilecek miktar: satırın ihtiyacından HENÜZ BOYAYA GÖNDERILMEMIŞ
      // kısım, depodaki ham stok payıyla sınırlı.
      //   kalanBoya = gereken - renkliStok - boyaGiden (stoktan karşılanan + boyada olan)
      //   miktar     = min(kalanBoya, hamPay) → depoda ham yoksa 0 (satın alma gerekir)
      const kalanBoya = Math.max(0, gereken - renkliStok - boyaGiden)
      const miktar = Math.min(hamPay, kalanBoya)
      if (miktar <= 0) return null
      return {
        malzemeKod: r.malzemeKod,
        malzemeAd: r.malzemeAd,
        miktar,
        birim: r.birim || 'mt',
        aciklama: `${r.siparisNo}${r.modelKod ? ' - ' + r.modelKod : ''}`,
        siparisKalemId: r.siparisKalemId ?? null,
        varyant1RenkId: r.varyant1RenkId ?? null,
        varyant1RenkKod: r.varyant1 || null,
        varyant1RenkAd: r.varyant1Aciklama || null,
        tahsis: [
          {
            siparisKalemId: r.siparisKalemId ?? null,
            siparisNo: r.siparisNo ?? '',
            modelKod: r.modelKod ?? '',
            miktar,
          },
        ],
      }
    })
    return baslangicKalemleriBirlestir(kalemler.filter((k) => k !== null) as IrsaliyeBaslangicKalem[])
  }

  // Seçili planlama satırlarından iş emri oluşturur. Satırlar sipariş bazında
  // gruplanır; aynı malzeme tek satırda birleşir. Miktar, satırın birimine göre
  // kg / mt / adet alanına yazılır.
  const isEmriOlustur = async (secili: KumasPlanlamaSatir[]) => {
    const uygun = secili.filter(
      (r) => r.siparisNo && r.malzemeId && (Number(r.gerekenMiktar) || 0) > 0,
    )
    if (uygun.length === 0) {
      message.warning('Seçili satırlarda iş emrine aktarılacak kumaş ihtiyacı yok')
      return
    }

    type KalemToplam = {
      malzemeId: number
      malzemeKod: string
      malzemeAd: string
      kg: number
      mt: number
      adet: number
    }
    const gruplar = new Map<string, Map<number, KalemToplam>>()
    const musteriSiparisler = new Map<string, string>()
    for (const r of uygun) {
      const siparisNo = String(r.siparisNo).trim()
      const malzemeId = r.malzemeId as number
      if (r.musteriSiparisNo) musteriSiparisler.set(siparisNo, r.musteriSiparisNo)
      const malzemeler = gruplar.get(siparisNo) ?? new Map<number, KalemToplam>()
      const hedef = malzemeler.get(malzemeId) ?? {
        malzemeId,
        malzemeKod: r.malzemeKod,
        malzemeAd: r.malzemeAd,
        kg: 0,
        mt: 0,
        adet: 0,
      }
      const miktar = Number(r.gerekenMiktar) || 0
      const birim = (r.birim || '').toLowerCase()
      if (birim.includes('kg')) hedef.kg += miktar
      else if (birim.includes('adet')) hedef.adet += miktar
      else hedef.mt += miktar
      malzemeler.set(malzemeId, hedef)
      gruplar.set(siparisNo, malzemeler)
    }

    setIsEmriOlusturuyor(true)
    const olusanlar: string[] = []
    try {
      for (const [siparisNo, malzemeler] of gruplar) {
        const kalemler = [...malzemeler.values()].map((k, i) => ({
          sira: i,
          siparisNo,
          malzemeId: k.malzemeId,
          malzemeKod: k.malzemeKod,
          malzemeAd: k.malzemeAd,
          kg: k.kg > 0.00005 ? Number(k.kg.toFixed(4)) : null,
          mt: k.mt > 0.00005 ? Number(k.mt.toFixed(4)) : null,
          adet: k.adet > 0.00005 ? Number(k.adet.toFixed(4)) : null,
        }))
        const created = await isEmriApi.create({
          aciklama: null,
          siparisNo,
          musteriSiparisNo: musteriSiparisler.get(siparisNo) ?? null,
          baslangicTarihi: null,
          bitisTarihi: null,
          durum: null,
          kalemler,
        })
        olusanlar.push(created.isEmriNo)
      }
      message.success(
        olusanlar.length === 1
          ? `İş emri oluşturuldu: ${olusanlar[0]}`
          : `${olusanlar.length} iş emri oluşturuldu: ${olusanlar.join(', ')}`,
      )
      if (olusanlar.length > 0) onIsEmriAc?.(olusanlar[olusanlar.length - 1])
    } catch (err) {
      const detay = err instanceof Error ? err.message : String(err)
      if (olusanlar.length > 0) {
        message.warning(
          `${olusanlar.join(', ')} oluşturuldu; kalanlar oluşturulamadı: ${detay}`,
        )
      } else {
        message.error('İş emri oluşturulamadı: ' + detay)
      }
    } finally {
      setIsEmriOlusturuyor(false)
    }
  }

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'is-emri-olustur') {
      const secili = gridRef.current?.api?.getSelectedRows() as KumasPlanlamaSatir[] | undefined
      if (!secili || secili.length === 0) {
        message.warning('Önce satır seçin (çoklu seçim için Ctrl+click)')
        return
      }
      if (!isEmriOlusturuyor) isEmriOlustur(secili)
      return
    }
    if (key === 'satinalma:satir' || key === 'satinalma:birlesik' || key === 'ham-satinalma-talimat') {
      const secili = gridRef.current?.api?.getSelectedRows() as KumasPlanlamaSatir[] | undefined
      if (!secili || secili.length === 0) {
        message.warning('Önce satır seçin (çoklu seçim için Ctrl+click)')
        return
      }
      const ham = key === 'ham-satinalma-talimat'
      let kalemler: IrsaliyeBaslangicKalem[]
      // Satın alma miktarı = AÇIK ihtiyaç (gereken - renkli - boyaGiden - hamPay).
      // Ham/renkli stokta veya boyada olan miktar tekrar siparişe dönmez.
      const satirlar = secili.filter((r) => (Number(r.acikMiktar) || 0) > 0)
      if (satirlar.length === 0) {
        message.warning('Seçili satırlarda satın alınacak açık ihtiyaç yok')
        return
      }
      if (ham) {
        kalemler = satirlar.map((r) => {
          const miktar = Number(r.acikMiktar) || 0
          const kalem: IrsaliyeBaslangicKalem = {
            malzemeKod: r.malzemeKod,
            malzemeAd: r.malzemeAd,
            miktar,
            birim: r.birim || 'mt',
            aciklama: `${r.siparisNo}${r.modelKod ? ' - ' + r.modelKod : ''}`,
            siparisKalemId: r.siparisKalemId ?? null,
            tahsis: [
              {
                siparisKalemId: r.siparisKalemId ?? null,
                siparisNo: r.siparisNo ?? '',
                modelKod: r.modelKod ?? '',
                miktar,
              },
            ],
          }
          return kalem
        })
        kalemler = baslangicKalemleriKumule(kalemler)
      } else {
        kalemler = satirlar.map((r) => {
          const miktar = Number(r.acikMiktar) || 0
          const kalem: IrsaliyeBaslangicKalem = {
            malzemeKod: r.malzemeKod,
            malzemeAd: r.malzemeAd,
            miktar,
            birim: r.birim || 'mt',
            aciklama: `${r.siparisNo}${r.modelKod ? ' - ' + r.modelKod : ''}`,
            siparisKalemId: r.siparisKalemId ?? null,
            tahsis: [
              {
                siparisKalemId: r.siparisKalemId ?? null,
                siparisNo: r.siparisNo ?? '',
                modelKod: r.modelKod ?? '',
                miktar,
              },
            ],
          }
          kalem.varyant1RenkId = r.varyant1RenkId ?? null
          kalem.varyant1RenkKod = r.varyant1 || null
          kalem.varyant1RenkAd = r.varyant1Aciklama || null
          return kalem
        })
        if (key === 'satinalma:birlesik') kalemler = baslangicKalemleriBirlestir(kalemler)
      }
      const olustur = () => onYeniSatinalmaSiparis?.(kalemler)
      const bayatSayisi = secili.filter((r) => r.guncelMi === false).length
      if (bayatSayisi > 0) {
        modal.confirm({
          title: 'Seçili satırların tedarik hesabı güncel değil',
          content: `${bayatSayisi} satır için sipariş bilgileri sonradan değişmiş, miktarlar eski olabilir. Yine de devam edilsin mi?`,
          okText: 'Yine de Devam Et',
          cancelText: 'Vazgeç',
          onOk: olustur,
        })
        return
      }
      olustur()
      return
    }
    if (key === 'mal-alim-irsaliye') {
      message.info('Mal Alım İrsaliyesi yakında')
      return
    }
    if (key === 'uretime-cikis') {
      const secili = gridRef.current?.api?.getSelectedRows() as KumasPlanlamaSatir[] | undefined
      if (!secili || secili.length === 0) {
        message.warning('Önce satır seçin (çoklu seçim için Ctrl+click)')
        return
      }
      const kalemler: StokFisiBaslangicKalem[] = secili.map((r) => {
        const miktar = Number(r.gerekenMiktar) || 0
        const mtMi = (r.birim || 'mt').toLowerCase() === 'mt'
        return {
          malzemeKod: r.malzemeKod,
          malzemeAd: r.malzemeAd,
          varyant1RenkId: r.varyant1RenkId ?? null,
          varyant1RenkAd: r.varyant1Aciklama ?? '',
          ...(mtMi ? { mt: miktar } : { kg: miktar }),
          hesapBirimi: mtMi ? 'mt' : 'kg',
          aciklama: `${r.siparisNo}${r.modelKod ? ' - ' + r.modelKod : ''}`,
        }
      })
      onUretimeCikis?.(kalemler)
      return
    }
    if (key === 'depo-stok') {
      const secili = gridRef.current?.api?.getSelectedRows() as KumasPlanlamaSatir[] | undefined
      if (!secili || secili.length === 0) {
        message.warning('Önce satır seçin')
        return
      }
      karsilamaAc(secili[0])
      return
    }
    if (key === 'tahsis-et') {
      const secili = gridRef.current?.api?.getSelectedRows() as KumasPlanlamaSatir[] | undefined
      if (!secili || secili.length === 0) {
        message.warning('Önce satır seçin (çoklu seçim için Ctrl+click)')
        return
      }
      const hedefler = secili.filter(
        (r) =>
          (Number(r.acikMiktar) || 0) > 0 &&
          r.siparisKalemId &&
          r.malzemeId &&
          r.varyant1RenkId != null,
      )
      if (hedefler.length === 0) {
        message.warning('Seçili satırlarda tahsis edilecek açık ihtiyaç yok (renksiz satırlar zaten stok havuzundan karşılanır)')
        return
      }
      kaynakSecimiAc(hedefler)
      return
    }
    if (key === 'tahsis-kaldir') {
      const secili = gridRef.current?.api?.getSelectedRows() as KumasPlanlamaSatir[] | undefined
      if (!secili || secili.length === 0) {
        message.warning('Önce satır seçin (çoklu seçim için Ctrl+click)')
        return
      }
      const hedefler = secili.filter((r) => r.siparisKalemId && r.malzemeId)
      if (hedefler.length === 0) {
        message.warning('Seçili satırlarda kaldırılacak tahsis yok')
        return
      }
      modal.confirm({
        title: 'Seçili satırların tahsisleri kaldırılsın mı?',
        content: `${hedefler.length} satır için yapılmış ham stok tahsisi silinecek; miktarlar free stoğa döner.`,
        okText: 'Kaldır',
        okButtonProps: { danger: true },
        cancelText: 'Vazgeç',
        onOk: async () => {
          try {
            let silinen = 0
            for (const r of hedefler) {
              const res = await tedarikApi.tahsisKaldir(
                r.siparisKalemId as number,
                r.malzemeId as number,
                r.varyant1RenkId ?? null,
              )
              silinen += res.silinen
            }
            await load()
            message.success(`${silinen} tahsis kaydı kaldırıldı`)
          } catch (err) {
            message.error(
              'Tahsis kaldırılamadı: ' + (err instanceof Error ? err.message : String(err)),
            )
          }
        },
      })
      return
    }
    if (key === 'hareket-detaylari') {
      const secili = gridRef.current?.api?.getSelectedRows() as KumasPlanlamaSatir[] | undefined
      if (!secili || secili.length === 0) {
        message.warning('Önce satır seçin')
        return
      }
      hareketAc(secili[0])
      return
    }
    if (key === 'renkler') {
      message.info('Renkler yakında')
      return
    }
    if (key.startsWith('fason:')) {
      const rest = key.slice('fason:'.length)
      const parts = rest.split(':')
      const fasonId = Number(parts[0])
      const mode = parts[1] || 'satir'
      const fason = fasonTipleri.find((f) => f.id === fasonId)
      if (!fason) return
      const secili = gridRef.current?.api?.getSelectedRows() as KumasPlanlamaSatir[] | undefined
      if (!secili || secili.length === 0) {
        message.warning('Önce satır seçin (çoklu seçim için Ctrl+click)')
        return
      }
      // Fason Talimatı (202): fiş alt tipi seçilen fason tipiyle (readonly) gelir.
      let kalemler = satirlariKalemeCevir(secili)
      if (mode === 'birlesik') kalemler = baslangicKalemleriBirlestir(kalemler)
      if (kalemler.length === 0) {
        message.warning('Seçili satırlarda fasona gönderilecek ham stok yok')
        return
      }
      onFasonTalimat?.(fasonId, kalemler)
      return
    }
  }

  return (
    <>
    <Dropdown
      menu={{ items: contextMenuItems, onClick: handleMenuClick }}
      trigger={['contextMenu']}
    >
      <div className="!p-3 !flex !flex-col !h-full">
        <div className="!flex !items-center !justify-between !mb-3">
          <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
            Kumaş Planlama
          </div>
          <div className="!flex !items-center !gap-1.5">
            <Input
              size="small"
              placeholder="Sipariş / Model / Müşteri / Malzeme ara..."
              allowClear
              prefix={<SearchOutlined style={{ fontSize: 12, color: '#9ca3af' }} />}
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              className="!w-64 !text-[12px]"
            />
            <button
              type="button"
              onClick={load}
              className="!text-[12px] !h-7 !px-2 !border !border-gray-300 !rounded !bg-white hover:!bg-gray-50 !flex !items-center !gap-1"
            >
              <ReloadOutlined /> Yenile
            </button>
          </div>
        </div>

        {bayatSatirlar.length > 0 && (
          <div className="!mb-2 !flex !items-center !gap-2 !rounded-sm !border !border-[#fcd34d] !bg-[#fffbeb] !px-3 !py-1.5 !flex-shrink-0">
            <WarningOutlined style={{ color: '#d97706' }} />
            <span className="!text-[12px] !text-[#92400e]">
              <span className="!font-semibold">{bayatSatirlar.length} satırın</span> tedarik hesabı
              güncel değil — {bayatSiparisSayisi} siparişte bilgiler değiştirilmiş. Turuncu
              işaretli satırlarla satın alma yapmayın.
            </span>
            <Button
              size="small"
              type="primary"
              loading={guncelleniyor}
              onClick={bayatlariGuncelle}
              className="!ml-auto !h-6 !text-[12px] !font-semibold !rounded-sm"
              style={{ backgroundColor: '#f57c00' }}
            >
              Yeniden Hesapla
            </Button>
          </div>
        )}

        <div className="!flex-1 !min-h-0" style={{ minHeight: 300 }}>
          <div className="!bg-white !rounded-sm !h-full !flex !flex-col">
            <div className="!flex-1 !min-h-0" style={{ minHeight: 250 }}>
              <DataGrid
                ref={gridRef}
                rowData={filtrelenmis}
                columnDefs={columns}
                domLayout="normal"
                storageKey="kumas-planlama"
                exportFileName="kumas-planlama"
                wrapperClassName="kumas-planlama-grid"
                enableRowSelection
                getRowClass={(p) => (p.data?.guncelMi === false ? 'bayat-satir' : '')}
                onCellContextMenu={(e: CellContextMenuEvent<KumasPlanlamaSatir>) => {
                  // Sağ tık tek satırı hedefler; seçili satıra sağ tıklanınca çoklu seçim korunur.
                  if (e.node?.isSelected()) return
                  e.api.deselectAll()
                  e.node?.setSelected(true)
                }}
              />
            </div>
            <div className="!border-t !border-gray-200 !px-3 !py-2 !flex !items-center !justify-between !bg-[#fafafa] !flex-shrink-0">
              <span className="!text-[11px] !text-[#9ca3af]">
                Toplam {satirlar.length} kayıt{sorguMetni}
              </span>
              <span className="!text-[11px] !text-[#9ca3af] !tabular-nums">
                Görüntülenen: {filtrelenmis.length}
              </span>
            </div>
          </div>
        </div>
      </div>
      </Dropdown>

      <Modal
        open={!!hareketSatir}
        onCancel={() => setHareketSatir(null)}
        footer={null}
        width="100vw"
        style={{ top: 0, maxWidth: '100vw', paddingBottom: 0 }}
        styles={{ body: { height: 'calc(100vh - 70px)', overflowY: 'auto' } }}
        title={
          hareketSatir
            ? `Hareket Detayları - ${hareketSatir.siparisNo} / ${hareketSatir.malzemeKod}${hareketSatir.varyant1 ? ` / ${hareketSatir.varyant1}` : ''}`
            : 'Hareket Detayları'
        }
      >
        <Table<KumasHareketSatiri>
          size="small"
          columns={hareketColumns}
          dataSource={hareketler}
          loading={hareketLoading}
          rowKey={(r) => r.kalemId}
          pagination={{ pageSize: 25, size: 'small', showSizeChanger: false }}
          locale={{ emptyText: 'Hareket bulunamadı' }}
        />
      </Modal>
      <Modal
        open={!!karsilamaSatir}
        onCancel={() => setKarsilamaSatir(null)}
        footer={null}
        width={640}
        title={
          karsilamaSatir
            ? `Depo Stok Kırılımı - ${karsilamaSatir.malzemeKod} / ${karsilamaSatir.varyant1Aciklama || 'Ham'}`
            : 'Depo Stok Kırılımı'
        }
      >
        {karsilamaSatir && (
          <div className="!mb-2 !text-[12px] !text-[#4b5563]">
            Gereken: <b>{Number(karsilamaSatir.gerekenMiktar).toLocaleString('tr-TR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} {karsilamaSatir.birim}</b>
            {' '}· Renkli: <b>{Number(karsilamaSatir.renkliStok).toLocaleString('tr-TR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</b>
            {' '}· Ham: <b>{Number(karsilamaSatir.hamStok).toLocaleString('tr-TR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</b>
            {' '}· Açık: <b>{Number(karsilamaSatir.acikMiktar).toLocaleString('tr-TR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</b>
          </div>
        )}
        <Table<KarsilamaDepoSatir>
          size="small"
          columns={karsilamaColumns}
          dataSource={karsilamaDepo}
          loading={karsilamaLoading}
          rowKey={(r) => r.depoKod}
          pagination={false}
          locale={{ emptyText: 'Serbest stok bulunamadı — temin gerekli (satın alma / dokuma / fason)' }}
        />
      </Modal>
      <Modal
        open={!!kaynakPlan}
        title="Ham Stoktan Tahsis — Kaynak Seçimi"
        width={1040}
        okText={kaynakOzet && kaynakOzet.acikToplam > 0.00005 ? 'Kısmi Rezerv Et' : 'Tahsis Et'}
        cancelText="Vazgeç"
        confirmLoading={tahsisKaydediyor}
        okButtonProps={{
          disabled: kaynakYukleniyor || !kaynakOzet || kaynakOzet.secilenToplam <= 0.00005,
        }}
        onOk={kaynakTahsisKaydet}
        onCancel={() => {
          if (!tahsisKaydediyor) setKaynakPlan(null)
        }}
      >
        {kaynakPlan && (
          <div className="text-sm">
            <p className="!mb-2 !text-[12px] !text-[#6b7280]">
              Girişi yapılmış, hiçbir siparişe bağlı olmayan (veya kalanı olan) ham kumaş satırları
              listelenir. Kullanılacak miktarı değiştirerek hangi fişten ne kadar tahsis edileceğini
              seçebilirsin. Bir kaynağın kalanı ve malzemenin açık ihtiyacı aşılamaz.
            </p>

            <div className="!mb-2 max-h-32 overflow-auto">
              <table className="w-full !text-[12px]">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-0.5">Sipariş</th>
                    <th>Model</th>
                    <th>Malzeme</th>
                    <th>Renk</th>
                    <th className="text-right">Açık İhtiyaç</th>
                  </tr>
                </thead>
                <tbody>
                  {kaynakPlan.hedefler.map((h) => (
                    <tr key={`${h.siparisKalemId}:${h.malzemeId}:${h.varyant1RenkId ?? 0}`}>
                      <td className="py-0.5">{h.siparisNo}</td>
                      <td>{h.modelKod || '-'}</td>
                      <td>{h.malzemeKod}</td>
                      <td>{h.varyant1 || '-'}</td>
                      <td className="text-right tabular-nums">
                        {f3(Number(h.acikMiktar) || 0)} {h.birim}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="!flex !items-center !justify-between !mb-1">
              <span className="!text-[12px] !text-[#4b5563]">Uygun ham stok fiş satırları</span>
              <div className="!flex !gap-2">
                <Button size="small" onClick={kaynakOneriUygula} disabled={kaynakYukleniyor}>
                  Önerilen Dağıtım
                </Button>
                <Button
                  size="small"
                  onClick={() => setKaynakPlan((p) => (p ? { ...p, secimler: {} } : p))}
                  disabled={kaynakYukleniyor}
                >
                  Seçimi Temizle
                </Button>
              </div>
            </div>
            <Table<TahsisKaynakSatir>
              size="small"
              columns={kaynakColumns}
              dataSource={kaynakPlan.kaynaklar}
              loading={kaynakYukleniyor}
              rowKey={(r) => r.irsaliyeKalemId}
              pagination={{ pageSize: 10, size: 'small', showSizeChanger: false }}
              rowClassName={(r) =>
                (kaynakPlan.secimler[r.irsaliyeKalemId] ?? 0) > 0 ? '!bg-[#ecfdf5]' : ''
              }
              locale={{
                emptyText:
                  'Uygun ham stok bulunamadı — girişi yapılmış, siparişe bağlı olmayan ham kumaş yok.',
              }}
            />

            {kaynakOzet && (
              <div className="!mt-2 !text-[12px] !text-[#333]">
                {kaynakOzet.malzemeler.map((m) => (
                  <div key={m.malzemeId} className="!flex !items-center !justify-between">
                    <span>
                      {m.kod} — {m.ad}
                    </span>
                    <span className="tabular-nums">
                      Seçilen: <b>{f3(m.secilen)}</b> / İhtiyaç: <b>{f3(m.ihtiyac)}</b> {m.birim}
                      {m.ihtiyac - m.secilen > 0.00005 && (
                        <span className="text-amber-600"> · Açık: {f3(m.ihtiyac - m.secilen)}</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}