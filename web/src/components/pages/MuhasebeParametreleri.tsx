'use client'

import { Tabs, Select, App } from 'antd'
import { useState, useEffect } from 'react'
import CardToolbar from '@/components/shared/CardToolbar'
import { parametreApi } from '@/lib/parametre-api'

const tabClass =
  '!px-3 !pt-2 !flex-1 !flex !flex-col !min-h-0 ' +
  '[&_.ant-tabs-content-holder]:!flex [&_.ant-tabs-content-holder]:!flex-col [&_.ant-tabs-content-holder]:!flex-1 [&_.ant-tabs-content-holder]:!min-h-0 ' +
  '[&_.ant-tabs-content]:!flex-1 [&_.ant-tabs-content]:!min-h-0 [&_.ant-tabs-tabpane]:!h-full ' +
  '[&_.ant-tabs-nav]:!mb-2 [&_.ant-tabs-nav]:!border-b [&_.ant-tabs-nav]:!border-gray-200 [&_.ant-tabs-nav]:!flex-shrink-0 ' +
  '[&_.ant-tabs-tab]:!text-[11px] [&_.ant-tabs-tab]:!px-2 [&_.ant-tabs-tab]:!py-1 [&_.ant-tabs-tab]:!bg-[#E0E0E0] [&_.ant-tabs-tab]:!border [&_.ant-tabs-tab]:!border-gray-200 [&_.ant-tabs-tab]:!text-[#333] ' +
  '[&_.ant-tabs-tab-active]:!bg-white [&_.ant-tabs-tab-active]:!border-t-2 [&_.ant-tabs-tab-active]:!border-t-[#FF9933] [&_.ant-tabs-tab-active]:!text-[#FF9933] ' +
  '[&_.ant-tabs-ink-bar]:!hidden'

const KUR_TIPI_SECENEKLERI = [
  { value: 'satis', label: 'Satış Kuru' },
  { value: 'alis', label: 'Alış Kuru' },
  { value: 'efektifSatis', label: 'Efektif Satış' },
  { value: 'efektifAlis', label: 'Efektif Alış' },
]

const KUR_KAYNAK_SECENEKLERI = [{ value: 'tcmb', label: 'TCMB' }]

const KONTROL_SECENEKLERI = [
  { value: 'izin', label: 'İzin Ver' },
  { value: 'uyar', label: 'Uyar' },
  { value: 'engelle', label: 'Engelle' },
]

export default function MuhasebeParametreleri() {
  const { message } = App.useApp()
  const [kurTipi, setKurTipi] = useState('satis')
  const [kurKaynak, setKurKaynak] = useState('tcmb')
  const [riskLimitKontrol, setRiskLimitKontrol] = useState('uyar')
  const [vadeKontrol, setVadeKontrol] = useState('uyar')
  const [yukluyor, setYukluyor] = useState(true)
  const [kaydediyor, setKaydediyor] = useState(false)

  useEffect(() => {
    Promise.all([
      parametreApi.get('doviz', 'kurTipi').then((p) => p?.deger || 'satis').catch(() => 'satis'),
      parametreApi.get('doviz', 'kurKaynak').then((p) => p?.deger || 'tcmb').catch(() => 'tcmb'),
      parametreApi.get('cari', 'riskLimitKontrol').then((p) => p?.deger || 'uyar').catch(() => 'uyar'),
      parametreApi.get('cari', 'vadeKontrol').then((p) => p?.deger || 'uyar').catch(() => 'uyar'),
    ])
      .then(([tip, kaynak, risk, vade]) => {
        setKurTipi(tip)
        setKurKaynak(kaynak)
        setRiskLimitKontrol(risk)
        setVadeKontrol(vade)
      })
      .finally(() => setYukluyor(false))
  }, [])

  const handleKaydet = async () => {
    setKaydediyor(true)
    try {
      await Promise.all([
        parametreApi.set('doviz', 'kurTipi', kurTipi),
        parametreApi.set('doviz', 'kurKaynak', kurKaynak),
        parametreApi.set('cari', 'riskLimitKontrol', riskLimitKontrol),
        parametreApi.set('cari', 'vadeKontrol', vadeKontrol),
      ])
      message.success('Parametreler kaydedildi')
    } catch {
      message.error('Kaydedilirken hata oluştu')
    } finally {
      setKaydediyor(false)
    }
  }

  return (
    <div className="!h-full !flex !flex-col">
      <CardToolbar buttons={[{ key: 'save', label: 'Kaydet', type: 'primary' as const, onClick: handleKaydet, disabled: kaydediyor }]} />
      <div className="!bg-white !border !border-gray-200 !rounded-sm !flex-1 !flex !flex-col !overflow-hidden">
        <Tabs
          size="small"
          tabBarGutter={2}
          defaultActiveKey="doviz"
          className={tabClass}
          items={[
            {
              key: 'doviz',
              label: 'Döviz / Kur',
              children: (
                <div className="!p-4"><div className="!w-full"><div className="!border !border-gray-200 !rounded-sm !p-2">
                  <div className="!flex !items-center !gap-2">
                    <label className="!text-[10px] !font-semibold !uppercase !w-72 !text-right !shrink-0">Merkez kur tipi</label>
                    <Select size="small" value={kurTipi} onChange={setKurTipi} disabled={yukluyor} options={KUR_TIPI_SECENEKLERI} className="!w-48 !text-[11px]" />
                    <span className="!text-[11px] !text-gray-500">Fiş/kartlarda varsayılan kur alanı</span>
                  </div>
                  <div className="!h-[2px]" />
                  <div className="!flex !items-center !gap-2">
                    <label className="!text-[10px] !font-semibold !uppercase !w-72 !text-right !shrink-0">Kur kaynağı</label>
                    <Select size="small" value={kurKaynak} onChange={setKurKaynak} disabled={yukluyor} options={KUR_KAYNAK_SECENEKLERI} className="!w-48 !text-[11px]" />
                  </div>
                </div></div></div>
              ),
            },
            {
              key: 'cari',
              label: 'Cari Kontroller',
              children: (
                <div className="!p-4"><div className="!w-full"><div className="!border !border-gray-200 !rounded-sm !p-2">
                  <div className="!flex !items-center !gap-2">
                    <label className="!text-[10px] !font-semibold !uppercase !w-72 !text-right !shrink-0">Risk limiti aşımı</label>
                    <Select size="small" value={riskLimitKontrol} onChange={setRiskLimitKontrol} disabled={yukluyor} options={KONTROL_SECENEKLERI} className="!w-48 !text-[11px]" />
                    <span className="!text-[11px] !text-gray-500">Cari risk limiti aşıldığında</span>
                  </div>
                  <div className="!h-[2px]" />
                  <div className="!flex !items-center !gap-2">
                    <label className="!text-[10px] !font-semibold !uppercase !w-72 !text-right !shrink-0">Vadesi geçmiş borç</label>
                    <Select size="small" value={vadeKontrol} onChange={setVadeKontrol} disabled={yukluyor} options={KONTROL_SECENEKLERI} className="!w-48 !text-[11px]" />
                    <span className="!text-[11px] !text-gray-500">Vadesi geçmiş açık borcu olan caride</span>
                  </div>
                </div></div></div>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}
