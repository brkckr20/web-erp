'use client'

import { useState, useMemo, useEffect } from 'react'
import { Select, Button, App, Spin } from 'antd'
import { CalculatorOutlined } from '@ant-design/icons'
import DataGrid from '@/components/shared/DataGrid'
import { siparisApi, type Siparis, type SiparisKalem } from '@/lib/siparis-api'
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

export default function TedarikEkrani({ tip }: TedarikEkraniProps) {
  const { message } = App.useApp()
  const [siparisler, setSiparisler] = useState<SiparisOption[]>([])
  const [siparislerLoading, setSiparislerLoading] = useState(false)
  const [siparisId, setSiparisId] = useState<number | null>(null)
  const [siparis, setSiparis] = useState<Siparis | null>(null)
  const [siparisLoading, setSiparisLoading] = useState(false)
  const [modelKey, setModelKey] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setSiparislerLoading(true)
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

  const ustGridKolonlar = useMemo<ColDef[]>(
    () => [
      { headerName: 'Malzeme Kodu', field: 'malzemeKodu', width: 140 },
      { headerName: 'Malzeme Adı', field: 'malzemeAdi', flex: 1, minWidth: 160 },
      { headerName: 'Miktar', field: 'miktar', width: 100 },
      { headerName: 'Birim', field: 'birim', width: 80 },
    ],
    [],
  )

  const altGridKolonlar = useMemo<ColDef[]>(
    () => [
      { headerName: 'Açıklama', field: 'aciklama', flex: 1, minWidth: 120 },
      { headerName: 'Tutar', field: 'tutar', width: 110 },
    ],
    [],
  )

  const handleHesapla = () => {
    if (!seciliKalem) {
      message.warning('Önce bir model seçin')
      return
    }
    message.info('Hesaplama henüz uygulanmadı')
  }

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
        </div>

        <Spin spinning={siparisLoading}>
          <div className="!flex-1 !flex !flex-col !min-h-0 !p-3 !gap-3">
            <div className="!h-[70%] !min-h-0 !border !border-gray-200 !rounded-sm !p-2">
              <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-2">
                Tedarik Detayları
              </div>
              <DataGrid
                rowData={[]}
                columnDefs={ustGridKolonlar}
                domLayout="normal"
                enableColumnChooser={false}
                enableExcelExport={false}
                height={260}
                wrapperClassName="!min-h-[260px]"
              />
            </div>
            <div className="!h-[30%] !min-h-0 !border !border-gray-200 !rounded-sm !p-2">
              <div className="!text-[10px] !font-bold !text-[#333] !uppercase !tracking-wide !mb-2">
                Hesaplanan İhtiyaç
              </div>
              <DataGrid
                rowData={[]}
                columnDefs={altGridKolonlar}
                domLayout="normal"
                enableColumnChooser={false}
                enableExcelExport={false}
                height={160}
                wrapperClassName="!min-h-[160px]"
              />
            </div>
          </div>
        </Spin>

        <div className="!px-3 !pb-3 !flex !justify-end">
          <Button
            type="primary"
            size="small"
            icon={<CalculatorOutlined />}
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
