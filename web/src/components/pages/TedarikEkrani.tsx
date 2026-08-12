'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Select, Button, App, Spin } from 'antd'
import { CalculatorOutlined } from '@ant-design/icons'
import DataGrid from '@/components/shared/DataGrid'
import { siparisApi, type Siparis, type SiparisKalem } from '@/lib/siparis-api'
import { tedarikApi, type HesaplaSonuc } from '@/lib/tedarik-api'
import type { ColDef } from 'ag-grid-community'

export type TedarikTipi = 'kumas' | 'iplik' | 'aksesuar'

const TEDARIK_BASLIKLAR: Record<TedarikTipi, string> = {
  kumas: 'Kumaş Tedarik',
  iplik: 'İplik Tedarik',
  aksesuar: 'Aksesuar Tedarik',
}

interface TedarikEkraniProps {
  tip: TedarikTipi
}

interface SiparisOption {
  value: number
  label: string
}

interface KumasDetaySatir {
  kumasKod: string
  kumasAdi: string
  varyant: string
  renk: string
  adet: number
  birim: string
  netMetraj: number
  kfMetraj: number
}

interface KumasIhtiyacSatir {
  kumasKod: string
  kumasAdi: string
  adet: number
  birim: string
  netMetraj: number
  kfMetraj: number
}

const fmt = (v: number | null | undefined, basamak = 2): string => {
  if (v === null || v === undefined || isNaN(v)) return ''
  return v.toLocaleString('tr-TR', { minimumFractionDigits: basamak, maximumFractionDigits: basamak })
}

const kesimFazlasiYuzde = (siparis: Siparis | null): number => {
  if (!siparis?.kesimFazlasi) return 0
  const n = parseFloat(String(siparis.kesimFazlasi).replace('%', '').replace(',', '.'))
  return isNaN(n) ? 0 : n
}

export default function TedarikEkrani({ tip }: TedarikEkraniProps) {
  const { message } = App.useApp()
  const [siparisler, setSiparisler] = useState<SiparisOption[]>([])
  const [siparislerLoading, setSiparislerLoading] = useState(true)
  const [siparisId, setSiparisId] = useState<number | null>(null)
  const [siparis, setSiparis] = useState<Siparis | null>(null)
  const [siparisLoading, setSiparisLoading] = useState(false)
  const [modelKey, setModelKey] = useState<string | null>(null)
  const [hesaplamaLoading, setHesaplamaLoading] = useState(false)
  const [detaySatirlar, setDetaySatirlar] = useState<KumasDetaySatir[]>([])
  const [ihtiyacSatirlar, setIhtiyacSatirlar] = useState<KumasIhtiyacSatir[]>([])
  const [durum, setDurum] = useState('')

  useEffect(() => {
    let active = true
    siparisApi
      .list()
      .then((list) => {
        if (!active) return
        setSiparisler(
          list.map((s) => ({
            value: s.id,
            label: `${s.siparisNo}${s.cariHesap ? ' - ' + s.cariHesap.ad : ''}`,
          })),
        )
      })
      .catch(() => {
        if (active) setSiparisler([])
      })
      .finally(() => {
        if (active) setSiparislerLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const loadSiparis = async (id: number) => {
    setSiparisLoading(true)
    setModelKey(null)
    setDetaySatirlar([])
    setIhtiyacSatirlar([])
    setDurum('')
    try {
      const s = await siparisApi.get(id)
      setSiparis(s)
      setSiparisId(id)
    } catch {
      message.error('Sipariş yüklenemedi')
      setSiparis(null)
    } finally {
      setSiparisLoading(false)
    }
  }

  const modeller = useMemo(() => {
    if (!siparis?.kalemler) return []
    const gorulen = new Set<number>()
    return (siparis.kalemler as SiparisKalem[]).filter((k) => {
      if (!k.malzeme) return false
      if (gorulen.has(k.malzeme.id)) return false
      gorulen.add(k.malzeme.id)
      return true
    }).map((k) => ({ key: `m-${k.malzeme!.id}`, kalem: k }))
  }, [siparis])

  const seciliKalem = useMemo(
    () => modeller.find((m) => m.key === modelKey)?.kalem ?? null,
    [modeller, modelKey],
  )

  const kfYuzde = useMemo(() => kesimFazlasiYuzde(siparis), [siparis])

  const hesaplaKumas = useCallback(
    async (kalem: SiparisKalem | null) => {
      if (!kalem?.malzeme) {
        setDetaySatirlar([])
        setIhtiyacSatirlar([])
        setDurum('')
        return
      }
      if (!siparisId) {
        message.warning('Sipariş ID eksik')
        setDetaySatirlar([])
        setIhtiyacSatirlar([])
        setDurum('')
        return
      }
      setHesaplamaLoading(true)
      setDurum('')
      try {
        const sonuc: HesaplaSonuc = await tedarikApi.hesapla(siparisId, kalem.id ?? null)
        const satirlar = sonuc.satirlar

        const detayList: KumasDetaySatir[] = satirlar
          .map((s): KumasDetaySatir => ({
            kumasKod: s.malzemeKod,
            kumasAdi: s.malzemeAd,
            varyant: s.kumasGrupKod,
            renk: s.renkKod ? `${s.renkKod} - ${s.renkAd ?? ''}`.trim() : s.renkAd ?? '',
            adet: 0,
            birim: s.birim,
            netMetraj: Number(s.brutMiktar) || 0,
            kfMetraj: Number(s.netMiktar) || 0,
          }))
          .sort((a, b) => a.kumasKod.localeCompare(b.kumasKod) || a.renk.localeCompare(b.renk))
        setDetaySatirlar(detayList)

        const ihtiyacTopla = new Map<string, KumasIhtiyacSatir>()
        for (const s of satirlar) {
          const key = s.malzemeKod
          const mevcut = ihtiyacTopla.get(key)
          if (mevcut) {
            mevcut.netMetraj += Number(s.brutMiktar) || 0
            mevcut.kfMetraj += Number(s.netMiktar) || 0
          } else {
            ihtiyacTopla.set(key, {
              kumasKod: s.malzemeKod,
              kumasAdi: s.malzemeAd,
              adet: 0,
              birim: s.birim,
              netMetraj: Number(s.brutMiktar) || 0,
              kfMetraj: Number(s.netMiktar) || 0,
            })
          }
        }
        setIhtiyacSatirlar([...ihtiyacTopla.values()].sort((a, b) => a.kumasKod.localeCompare(b.kumasKod)))

        if (detayList.length === 0) {
          setDurum('Seçili model için hesaplanacak veri bulunamadı (reçete miktarı veya sipariş beden adedi kontrol edin)')
        } else {
          setDurum(`${ihtiyacTopla.size} kumaş için ${detayList.length} satır hesaplandı; veritabanına kaydedildi`)
        }
      } catch (err) {
        message.error(err instanceof Error ? err.message : 'Hesaplama sırasında hata oluştu')
        setDetaySatirlar([])
        setIhtiyacSatirlar([])
        setDurum('')
      } finally {
        setHesaplamaLoading(false)
      }
    },
    [message, siparisId],
  )

  const handleHesapla = () => {
    if (tip !== 'kumas') {
      message.info('Bu tip için hesaplama henüz uygulanmadı')
      return
    }
    if (!siparisId) {
      message.warning('Önce Order No seçin')
      return
    }
    if (!seciliKalem) {
      message.warning('Önce bir model seçin')
      return
    }
    hesaplaKumas(seciliKalem)
  }

  const detayGridKolonlar = useMemo<ColDef[]>(() => {
    if (tip !== 'kumas') {
      return [
        { headerName: 'Malzeme Kodu', field: 'malzemeKodu', width: 140 },
        { headerName: 'Malzeme Adı', field: 'malzemeAdi', flex: 1, minWidth: 160 },
        { headerName: 'Miktar', field: 'miktar', width: 100 },
        { headerName: 'Birim', field: 'birim', width: 80 },
      ]
    }
    return [
      { headerName: 'Kumaş Kodu', field: 'kumasKod', width: 130 },
      { headerName: 'Kumaş Adı', field: 'kumasAdi', flex: 1, minWidth: 140 },
      { headerName: 'Varyant-1', field: 'varyant', width: 90 },
      { headerName: 'Renk', field: 'renk', width: 150 },
      { headerName: 'Miktar', field: 'netMetraj', width: 120, cellClass: '!text-right', valueFormatter: (p) => fmt(p.value) },
      { headerName: 'Birim', field: 'birim', width: 80 },
      { headerName: 'KF Dahil (mt)', field: 'kfMetraj', width: 120, cellClass: '!text-right', valueFormatter: (p) => fmt(p.value) },
    ]
  }, [tip])

  const ihtiyacGridKolonlar = useMemo<ColDef[]>(() => {
    if (tip !== 'kumas') {
      return [
        { headerName: 'Açıklama', field: 'aciklama', flex: 1, minWidth: 120 },
        { headerName: 'Tutar', field: 'tutar', width: 110 },
      ]
    }
    return [
      { headerName: 'Kumaş Kodu', field: 'kumasKod', width: 130 },
      { headerName: 'Kumaş Adı', field: 'kumasAdi', flex: 1, minWidth: 140 },
      { headerName: 'Miktar', field: 'netMetraj', width: 130, cellClass: '!text-right', valueFormatter: (p) => fmt(p.value) },
      { headerName: 'Birim', field: 'birim', width: 80 },
      { headerName: 'KF Dahil (mt)', field: 'kfMetraj', width: 130, cellClass: '!text-right', valueFormatter: (p) => fmt(p.value) },
    ]
  }, [tip])

  return (
    <div className="!h-full !flex !flex-col !p-3">
      <div className="!bg-white !border !border-gray-200 !rounded-sm !flex-1 !flex !flex-col !overflow-hidden">
        <div className="!px-3 !pt-3 !pb-2 !border-b !border-gray-200">
          <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider !mb-3">
            {TEDARIK_BASLIKLAR[tip]}
          </div>
          <div className="!flex !items-center !gap-3 !flex-wrap">
            <div className="!flex !items-center !gap-2">
              <label className="!text-[10px] !font-semibold !uppercase !w-16 !text-right !shrink-0">Order No</label>
              <Select
                showSearch
                size="small"
                loading={siparislerLoading}
                value={siparisId ?? undefined}
                placeholder="Sipariş ara / seç..."
                className="!w-64 !text-[11px]"
                optionFilterProp="label"
                options={siparisler}
                onChange={(id: number) => loadSiparis(id)}
              />
            </div>
            <div className="!flex !items-center !gap-2">
              <label className="!text-[10px] !font-semibold !uppercase !w-16 !text-right !shrink-0">Model Kodu</label>
              <Select
                size="small"
                loading={siparisLoading}
                value={modelKey ?? undefined}
                placeholder={siparisId ? 'Model seçin' : 'Önce Order No seçin'}
                className="!w-72 !text-[11px]"
                notFoundContent={siparisId ? 'Modele bağlı malzeme yok' : 'Order No seçilmedi'}
                options={modeller.map((m) => ({
                  value: m.key,
                  label: m.kalem.malzeme ? `${m.kalem.malzeme.kod} - ${m.kalem.malzeme.ad}` : m.key,
                }))}
                onChange={setModelKey}
              />
            </div>
          </div>
          {tip === 'kumas' && (
            <div className="!flex !items-center !gap-3 !mt-2 !text-[11px]">
              <span className={durum ? '!text-[#b45309]' : '!text-[#9ca3af]'}>{durum || 'Hesaplama için model seçin'}</span>
              {kfYuzde > 0 && <span className="!text-[#9ca3af]">Kesim fazlası: %{kfYuzde} uygulandı</span>}
            </div>
          )}
        </div>

        <Spin spinning={siparisLoading}>
          <div className="!flex-1 !flex !flex-col !min-h-0 !p-3 !gap-3">
            <div className="!h-[60%] !min-h-[300px] !border !border-gray-200 !rounded-sm !p-2">
              <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-2">
                Tedarik Detayları
              </div>
              <DataGrid
                rowData={detaySatirlar}
                columnDefs={detayGridKolonlar}
                domLayout="normal"
                enableColumnChooser={false}
                enableExcelExport={false}
                height={300}
                wrapperClassName="!min-h-[300px]"
              />
            </div>
            <div className="!h-[40%] !min-h-[180px] !border !border-gray-200 !rounded-sm !p-2">
              <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-2">
                Hesaplanan İhtiyaç
              </div>
              <DataGrid
                rowData={ihtiyacSatirlar}
                columnDefs={ihtiyacGridKolonlar}
                domLayout="normal"
                enableColumnChooser={false}
                enableExcelExport={false}
                height={180}
                wrapperClassName="!min-h-[180px]"
              />
            </div>
          </div>
        </Spin>

        <div className="!px-3 !pb-3 !flex !justify-end">
          <Button
            type="primary"
            size="small"
            icon={<CalculatorOutlined />}
            loading={hesaplamaLoading}
            onClick={handleHesapla}
            className="!text-[11px]"
          >
            Hesapla
          </Button>
        </div>
      </div>
    </div>
  )
}
