'use client'

import { useState, useCallback } from 'react'
import { Layout, ConfigProvider, App, Spin } from 'antd'
import trTR from 'antd/locale/tr_TR'
import { useAuth } from '@/context/AuthContext'
import LoginPage from '@/components/pages/LoginPage'
import Sidebar from './Sidebar'
import MegaMenu from './MegaMenu'
import TabBar from './TabBar'
import { Module, Tab } from '@/data/modules'
import DepoKarti from '@/components/pages/DepoKarti'
import DepoListesi from '@/components/pages/DepoListesi'
import KullaniciKarti from '@/components/pages/KullaniciKarti'
import KullaniciListesi from '@/components/pages/KullaniciListesi'
import MalzemeKarti from '@/components/pages/MalzemeKarti'
import MalzemeListesi from '@/components/pages/MalzemeListesi'
import MakinaKarti from '@/components/pages/MakinaKarti'
import MakinaListesi from '@/components/pages/MakinaListesi'
import StokHareketFisiListesi from '@/components/pages/StokHareketFisiListesi'
import StokHareketFisiKarti from '@/components/pages/StokHareketFisiKarti'
import DepoBazliStok from '@/components/pages/DepoBazliStok'
import CariHesapKarti from '@/components/pages/CariHesapKarti'
import CariHesapListesi from '@/components/pages/CariHesapListesi'
import KaliteKontrolListesi from '@/components/pages/KaliteKontrolListesi'
import KaliteKontrolKarti from '@/components/pages/KaliteKontrolKarti'
import HataTanimKarti from '@/components/pages/HataTanimKarti'
import HataTanimListesi from '@/components/pages/HataTanimListesi'
import IsEmriKarti from '@/components/pages/IsEmriKarti'
import IsEmriListesi from '@/components/pages/IsEmriListesi'
import KumasListesi from '@/components/pages/KumasListesi'
import KumasKarti from '@/components/pages/KumasKarti'
import NumaratorListesi from '@/components/pages/NumaratorListesi'
import NumaratorKarti from '@/components/pages/NumaratorKarti'

const { Content } = Layout

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth()
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTab, setActiveTab] = useState<string | null>(null)

  const handleModuleSelect = (mod: Module) => {
    setSelectedModule((prev) => (prev?.key === mod.key ? null : mod))
  }

  const handleSubItemClick = useCallback((tab: Tab) => {
    setTabs((prev) => {
      const exists = prev.find((t) => t.key === tab.key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(tab.key)
  }, [])

  const handleTabChange = (key: string) => {
    setActiveTab(key)
  }

  const openDepoKarti = useCallback((kod: string) => {
    const key = 'depo-karti-' + kod
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Depo Kartı - ' + kod, moduleKey: 'stok', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openYeniDepo = useCallback(() => {
    const key = 'depo-karti-yeni'
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Yeni Depo Kartı', moduleKey: 'stok', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openKullaniciKarti = useCallback((kod: string) => {
    const key = 'kullanici-karti-' + kod
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Kullanıcı Kartı - ' + kod, moduleKey: 'ayarlar', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openYeniKullanici = useCallback(() => {
    const key = 'kullanici-karti-yeni'
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Yeni Kullanıcı Kartı', moduleKey: 'ayarlar', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const fisTipiLabelMap: Record<string, string> = {
    '10': '10-Üretim Fişi', '16': '16-Sayım Fişi', '17': '17-Depo Transfer Fişi',
    '18': '18-Özel Fiş (Giriş)', '20': '20-Karma Koli Üretim', '21': '21-Karma Koli Sarf Bozma',
    '40': '40-Üretimden İade', '99': '99-Sayım Farkı Noksanı', '101': '101-Sayım Farkı Fazlası',
    '130': '130-Sarf Fişi', '131': '131-Fire Fişi', '132': '132-Özel Fiş (Çıkış)',
    '135': '135-Transfer Çıkış', '136': '136-Karma Koli Sarf', '137': '137-Karma Koli Bozma',
    '140': '140-Üretime Çıkış Fişi',
  }

  const openYeniStokHareketFisi = useCallback((fisTipi: string) => {
    const label = fisTipiLabelMap[fisTipi] || 'Stok Hareket Fişi'
    const key = 'stok-hareket-fisi-yeni-' + fisTipi
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Yeni ' + label, moduleKey: 'stok', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openStokHareketFisiKarti = useCallback(
    (info: { id: number; fisTipi: string; fisNo: string }) => {
      const key = 'stok-hareket-fisi-karti-' + info.id
      const label = (fisTipiLabelMap[info.fisTipi] || info.fisTipi) + '-' + info.fisNo
      setTabs((prev) => {
        const tab: Tab = { key, label, moduleKey: 'stok', isForm: true }
        const exists = prev.find((t) => t.key === key)
        if (!exists) return [...prev, tab]
        return prev
      })
      setActiveTab(key)
    },
    [],
  )

  const handleStokHareketFisiDeleted = useCallback((fisTipi: string) => {
    const currentKey = activeTab
    setTabs((prev) => prev.filter((t) => t.key !== currentKey))
    openYeniStokHareketFisi(fisTipi)
  }, [activeTab, openYeniStokHareketFisi])

  const openMalzemeKarti = useCallback((kod: string) => {
    const key = 'malzeme-karti-' + kod
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Malzeme Kartı - ' + kod, moduleKey: 'stok', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openYeniMalzeme = useCallback(() => {
    const key = 'malzeme-karti-yeni'
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Yeni Malzeme Kartı', moduleKey: 'stok', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openMakinaKarti = useCallback((kod: string) => {
    const key = 'makina-karti-' + kod
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Makina Kartı - ' + kod, moduleKey: 'stok', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openYeniMakina = useCallback(() => {
    const key = 'makina-karti-yeni'
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Yeni Makina Kartı', moduleKey: 'stok', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openCariHesapKarti = useCallback((kod: string) => {
    const key = 'cari-hesap-karti-' + kod
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Cari Hesap Kartı - ' + kod, moduleKey: 'satis', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openYeniCariHesap = useCallback(() => {
    const key = 'cari-hesap-karti-yeni'
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Yeni Cari Hesap Kartı', moduleKey: 'satis', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openYeniKaliteKontrol = useCallback(() => {
    const key = 'kalite-kontrol-karti-yeni'
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Yeni Kalite Kontrol Fişi', moduleKey: 'stok', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openKaliteKontrolKarti = useCallback((id: number) => {
    const key = 'kalite-kontrol-karti-' + id
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Kalite Kontrol Fişi - ' + id, moduleKey: 'stok', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openHataTanimKarti = useCallback((kod: string) => {
    const key = 'hata-tanim-karti-' + kod
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Hata Tanım Kartı - ' + kod, moduleKey: 'stok', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openYeniHataTanim = useCallback(() => {
    const key = 'hata-tanim-karti-yeni'
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Yeni Hata Tanım Kartı', moduleKey: 'stok', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openKumasKarti = useCallback((kod: string) => {
    const key = 'kumas-karti-' + kod
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Kumaş Kartı - ' + kod, moduleKey: 'stok', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openYeniKumas = useCallback(() => {
    const key = 'kumas-karti-yeni'
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Yeni Kumaş Kartı', moduleKey: 'stok', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openNumaratorKarti = useCallback((id: number) => {
    const key = 'numarator-karti-' + id
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Numaratör Kartı - ' + id, moduleKey: 'stok', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openYeniNumarator = useCallback(() => {
    const key = 'numarator-karti-yeni'
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Yeni Numaratör Kartı', moduleKey: 'stok', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openIsEmriKarti = useCallback((kod: string) => {
    const key = 'is-emri-karti-' + kod
    setTabs((prev) => {
      const tab: Tab = { key, label: 'İş Emri Kartı - ' + kod, moduleKey: 'uretim', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openYeniIsEmri = useCallback(() => {
    const key = 'is-emri-karti-yeni'
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Yeni İş Emri Kartı', moduleKey: 'uretim', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const handleTabClose = (key: string) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.key === key)
      const next = prev.filter((t) => t.key !== key)

      if (key === activeTab && next.length > 0) {
        const newIdx = Math.min(idx, next.length - 1)
        setActiveTab(next[newIdx].key)
      } else if (next.length === 0) {
        setActiveTab(null)
      }

      return next
    })
  }

  const renderTabContent = (tab: Tab) => {
    if (tab.key === 'depo-tanimlari') {
      return <DepoListesi onSelect={openDepoKarti} onNew={openYeniDepo} />
    }
    if (tab.key === 'depo-karti-yeni') {
      return <DepoKarti isNew />
    }
    if (tab.key.startsWith('depo-karti-')) {
      return <DepoKarti kod={tab.key.replace('depo-karti-', '')} />
    }
    if (tab.key === 'kullanici-tanimlari') {
      return <KullaniciListesi onSelect={openKullaniciKarti} onNew={openYeniKullanici} />
    }
    if (tab.key === 'kullanici-karti-yeni') {
      return <KullaniciKarti isNew />
    }
    if (tab.key.startsWith('kullanici-karti-')) {
      return <KullaniciKarti kod={tab.key.replace('kullanici-karti-', '')} />
    }
    if (tab.key === 'stok-hareket-fisleri') {
      return <StokHareketFisiListesi onNew={openYeniStokHareketFisi} onSelect={openStokHareketFisiKarti} />
    }
    if (tab.key === 'depo-bazli-stok') {
      return <DepoBazliStok />
    }
    if (tab.key.startsWith('stok-hareket-fisi-yeni-')) {
      const fisTipi = tab.key.replace('stok-hareket-fisi-yeni-', '')
      return <StokHareketFisiKarti fisTipi={fisTipi} />
    }
    if (tab.key.startsWith('stok-hareket-fisi-karti-')) {
      const fisId = Number(tab.key.replace('stok-hareket-fisi-karti-', ''))
      return <StokHareketFisiKarti id={fisId} onDeleted={(ft) => handleStokHareketFisiDeleted(ft)} />
    }
    if (tab.key === 'malzeme-kartlari') {
      return <MalzemeListesi onSelect={openMalzemeKarti} onNew={openYeniMalzeme} />
    }
    if (tab.key === 'malzeme-karti-yeni') {
      return <MalzemeKarti isNew />
    }
    if (tab.key.startsWith('malzeme-karti-')) {
      return <MalzemeKarti kod={tab.key.replace('malzeme-karti-', '')} />
    }
    if (tab.key === 'makina-kartlari') {
      return <MakinaListesi onSelect={openMakinaKarti} onNew={openYeniMakina} />
    }
    if (tab.key === 'makina-karti-yeni') {
      return <MakinaKarti isNew />
    }
    if (tab.key.startsWith('makina-karti-')) {
      return <MakinaKarti kod={tab.key.replace('makina-karti-', '')} />
    }
    if (tab.key === 'cari-hesap-karti') {
      return <CariHesapListesi onSelect={openCariHesapKarti} onNew={openYeniCariHesap} />
    }
    if (tab.key === 'cari-hesap-karti-yeni') {
      return <CariHesapKarti isNew />
    }
    if (tab.key.startsWith('cari-hesap-karti-')) {
      return <CariHesapKarti kod={tab.key.replace('cari-hesap-karti-', '')} />
    }
    if (tab.key === 'kalite-kontrol-giris') {
      return <KaliteKontrolListesi onNew={openYeniKaliteKontrol} onSelect={openKaliteKontrolKarti} />
    }
    if (tab.key === 'kalite-kontrol-karti-yeni') {
      return <KaliteKontrolKarti />
    }
    if (tab.key.startsWith('kalite-kontrol-karti-')) {
      const kkId = Number(tab.key.replace('kalite-kontrol-karti-', ''))
      return <KaliteKontrolKarti id={kkId} onDeleted={() => handleTabClose(tab.key)} />
    }
    if (tab.key === 'is-emri-tanimlari') {
      return <IsEmriListesi onSelect={openIsEmriKarti} onNew={openYeniIsEmri} />
    }
    if (tab.key === 'is-emri-karti-yeni') {
      return <IsEmriKarti isNew />
    }
    if (tab.key.startsWith('is-emri-karti-')) {
      return <IsEmriKarti kod={tab.key.replace('is-emri-karti-', '')} />
    }
    if (tab.key === 'kumas-kartlari') {
      return <KumasListesi onSelect={openKumasKarti} onNew={openYeniKumas} />
    }
    if (tab.key === 'kumas-karti-yeni') {
      return <KumasKarti isNew />
    }
    if (tab.key.startsWith('kumas-karti-')) {
      return <KumasKarti kod={tab.key.replace('kumas-karti-', '')} />
    }
    if (tab.key === 'numarator-tanimlari') {
      return <NumaratorListesi onSelect={openNumaratorKarti} onNew={openYeniNumarator} />
    }
    if (tab.key === 'numarator-karti-yeni') {
      return <NumaratorKarti isNew />
    }
    if (tab.key.startsWith('numarator-karti-')) {
      return <NumaratorKarti id={Number(tab.key.replace('numarator-karti-', ''))} />
    }
    if (tab.key === 'hata-tanimlari') {
      return <HataTanimListesi onSelect={openHataTanimKarti} onNew={openYeniHataTanim} />
    }
    if (tab.key === 'hata-tanim-karti-yeni') {
      return <HataTanimKarti isNew />
    }
    if (tab.key.startsWith('hata-tanim-karti-')) {
      return <HataTanimKarti kod={tab.key.replace('hata-tanim-karti-', '')} />
    }
    return (
      <div className="!p-3">
        <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider !mb-3">
          {tab.label}
        </div>
        <div className="!bg-white !rounded-sm !p-4">
          <div className="!text-[11px] !text-[#6b7280]">
            {tab.label} sayfası henüz oluşturulmadı.
          </div>
        </div>
      </div>
    )
  }

  const tabPanels = tabs.map((tab) => (
    <div key={tab.key} style={{ display: activeTab === tab.key ? 'block' : 'none', height: '100%' }}>
      {renderTabContent(tab)}
    </div>
  ))

  return (
    <ConfigProvider
      locale={trTR}
      theme={{
        token: {
          fontSize: 12,
          borderRadius: 4,
          padding: 8,
          margin: 8,
        },
      }}
    >
      <App>
        {loading ? (
          <div className="!min-h-screen !flex !items-center !justify-center !bg-[#f0f0f0]">
            <Spin />
          </div>
        ) : !token ? (
          <LoginPage />
        ) : (
          <Layout className="!h-screen">
            <Sidebar
              selectedModule={selectedModule?.key ?? null}
              onModuleSelect={handleModuleSelect}
            />

            {selectedModule && (
              <MegaMenu
                module={selectedModule}
                onClose={() => setSelectedModule(null)}
                onSubItemClick={handleSubItemClick}
              />
            )}

            <Layout style={{ marginLeft: 178 }} className="!overflow-hidden">
              <TabBar
                tabs={tabs}
                activeKey={activeTab}
                onTabChange={handleTabChange}
                onTabClose={handleTabClose}
              />
              <Content className="!p-0 !bg-[#F0F0F0] !flex-1 !overflow-hidden">
                {activeTab ? tabPanels : children}
              </Content>
            </Layout>
          </Layout>
        )}
      </App>
    </ConfigProvider>
  )
}
