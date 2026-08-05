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
import IplikListesi from '@/components/pages/IplikListesi'
import IplikKarti from '@/components/pages/IplikKarti'
import NumaratorListesi from '@/components/pages/NumaratorListesi'
import NumaratorKarti from '@/components/pages/NumaratorKarti'
import RenkKarti from '@/components/pages/RenkKarti'
import RenkListesi from '@/components/pages/RenkListesi'
import BoyahaneRenkKarti from '@/components/pages/BoyahaneRenkKarti'
import BoyahaneRenkListesi from '@/components/pages/BoyahaneRenkListesi'
import ModelKarti from '@/components/pages/ModelKarti'
import ModelListesi from '@/components/pages/ModelListesi'
import MarkaKarti from '@/components/pages/MarkaKarti'
import MarkaListesi from '@/components/pages/MarkaListesi'
import GrupKarti from '@/components/pages/GrupKarti'
import GrupListesi from '@/components/pages/GrupListesi'
import BedenKarti from '@/components/pages/BedenKarti'
import BedenListesi from '@/components/pages/BedenListesi'
import GtipListesi from '@/components/pages/GtipListesi'
import GtipKarti from '@/components/pages/GtipKarti'
import AksesuarTipiListesi from '@/components/pages/AksesuarTipiListesi'
import AksesuarTipiKarti from '@/components/pages/AksesuarTipiKarti'
import AksesuarListesi from '@/components/pages/AksesuarListesi'
import AksesuarKarti from '@/components/pages/AksesuarKarti'
import DovizListesi from '@/components/pages/DovizListesi'
import DovizKarti from '@/components/pages/DovizKarti'
import SiparisGirisi from '@/components/pages/SiparisGirisi'
import SiparisKarti from '@/components/pages/SiparisKarti'
import IrsaliyeListesi from '@/components/pages/IrsaliyeListesi'
import IrsaliyeKarti from '@/components/pages/IrsaliyeKarti'
import MalzemeYonetimParametreleri from '@/components/pages/MalzemeYonetimParametreleri'
import FormTasarimi from '@/components/pages/FormTasarimi'

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
    '10': '10-Üretim Fişi', '16': '16-Sayım Fişi', '17': '17-Depo Transfer Giriş',
    '18': '18-Özel Fiş (Giriş)', '20': '20-Karma Koli Üretim', '21': '21-Karma Koli Sarf Bozma',
    '40': '40-Üretimden İade', '99': '99-Sayım Farkı Noksanı', '101': '101-Sayım Farkı Fazlası',
    '130': '130-Sarf Fişi', '131': '131-Fire Fişi', '132': '132-Özel Fiş (Çıkış)',
    '135': '135-Transfer Çıkış', '136': '136-Karma Koli Sarf', '137': '137-Karma Koli Bozma',
    '140': '140-Üretime Çıkış Fişi',
  }

  const irsaliyeTipiLabelMap: Record<string, string> = {
    '1': '1-Mal Alım İrsaliyesi',
    '2': '2-Perakende Satış İade İrsaliyesi',
    '3': '3-Toptan Satış İade İrsaliyesi',
    '4': '4-Konsinye Çıkış İade İrsaliyesi',
    '5': '5-Konsinye Giriş İrsaliyesi',
    '6': '6-Fasona Giriş İrsaliyesi',
    '7': '7-Alınan Fiyat Farkı İrsaliyesi',
    '8': '8-Konsinye Satır İrsaliyesi',
    '9': '9-Müstahsil İrsaliyesi',
    '11': '11-Fasondan Giriş İrsaliyesi',
    '12': '12-Fason Çıkış İade İrsaliyesi',
    '22': '22-Alınan Hizmet İrsaliyesi',
    '23': '23-Verilen Hizmet İadesi',
    '92': '92-Serbest Meslek Makbuzu',
    '120': '120-Toptan Satış İrsaliyesi',
    '121': '121-Perakende Satır İrsaliyesi',
    '122': '122-Mal Alım İade İrsaliyesi',
    '123': '123-Konsinye Çıkış İrsaliyesi',
    '124': '124-Konsinye Giriş İade İrsaliyesi',
    '125': '125-Fason Giriş İrsaliyesi',
    '126': '126-Verilen Fiyat Farkı İrsaliyesi',
    '133': '133-Fasona Giriş İade İrsaliyesi',
    '134': '134-Fasona Çıkış İrsaliyesi',
    '138': '138-Verilen Hizmet İrsaliyesi',
    '139': '139-Alınan Hizmet İadesi',
    '192': '192-Serbest Meslek Makbuzu',
  }

  const openYeniIrsaliye = useCallback((irsaliyeTipi: string, fasonTipiId?: number | null) => {
    const label = irsaliyeTipiLabelMap[irsaliyeTipi] || 'Satış İrsaliyesi'
    const key = 'satis-irsaliye-yeni-' + irsaliyeTipi + (fasonTipiId ? '-ft' + fasonTipiId : '')
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Yeni ' + label, moduleKey: 'satis', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [irsaliyeTipiLabelMap])

  const openIrsaliyeKarti = useCallback(
    (info: { id: number; irsaliyeTipi: string; irsaliyeNo: string }) => {
      const key = 'satis-irsaliye-karti-' + info.id
      const label = (irsaliyeTipiLabelMap[info.irsaliyeTipi] || info.irsaliyeTipi) + '-' + info.irsaliyeNo
      setTabs((prev) => {
        const tab: Tab = { key, label, moduleKey: 'satis', isForm: true, irsaliyeTipi: info.irsaliyeTipi }
        const exists = prev.find((t) => t.key === key)
        if (!exists) return [...prev, tab]
        return prev
      })
      setActiveTab(key)
    },
    [irsaliyeTipiLabelMap],
  )

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

  const openIplikKarti = useCallback((kod: string) => {
    const key = 'iplik-karti-' + kod
    setTabs((prev) => {
      const tab: Tab = { key, label: 'İplik Kartı - ' + kod, moduleKey: 'stok', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openYeniIplik = useCallback(() => {
    const key = 'iplik-karti-yeni'
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Yeni İplik Kartı', moduleKey: 'stok', isForm: true }
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

  const openRenkKarti = useCallback((kod: string) => {
    const key = 'renk-karti-' + kod
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Renk Kartı - ' + kod, moduleKey: 'siparis', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openYeniRenk = useCallback(() => {
    const key = 'renk-karti-yeni'
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Yeni Renk Kartı', moduleKey: 'siparis', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openDovizKarti = useCallback((kod: string) => {
    const key = 'doviz-karti-' + kod
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Döviz Kartı - ' + kod, moduleKey: 'muhasebe', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openYeniDoviz = useCallback(() => {
    const key = 'doviz-karti-yeni'
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Yeni Döviz Kartı', moduleKey: 'muhasebe', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openBoyahaneRenkKarti = useCallback((kod: string) => {
    const key = 'boyahane-renk-karti-' + kod
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Boyahane Renk Kartı - ' + kod, moduleKey: 'siparis', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openYeniBoyahaneRenk = useCallback(() => {
    const key = 'boyahane-renk-karti-yeni'
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Yeni Boyahane Renk Kartı', moduleKey: 'siparis', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openModelKarti = useCallback((kod: string) => {
    const key = 'model-karti-' + kod
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Model Kartı - ' + kod, moduleKey: 'siparis', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openYeniModel = useCallback(() => {
    const key = 'model-karti-yeni'
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Yeni Model Kartı', moduleKey: 'siparis', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openMarkaKarti = useCallback((kod: string) => {
    const key = 'marka-karti-' + kod
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Marka Kartı - ' + kod, moduleKey: 'siparis', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openYeniMarka = useCallback(() => {
    const key = 'marka-karti-yeni'
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Yeni Marka Kartı', moduleKey: 'siparis', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openGrupKarti = useCallback((kod: string) => {
    const key = 'grup-karti-' + kod
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Grup Kartı - ' + kod, moduleKey: 'siparis', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openYeniGrup = useCallback(() => {
    const key = 'grup-karti-yeni'
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Yeni Grup Kartı', moduleKey: 'siparis', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openBedenKarti = useCallback((kod: string) => {
    const key = 'beden-tanim-' + kod
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Beden Kartı - ' + kod, moduleKey: 'siparis', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openYeniBeden = useCallback(() => {
    const key = 'beden-tanim-yeni'
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Yeni Beden Kartı', moduleKey: 'siparis', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openGtipKarti = useCallback((kod: string) => {
    const key = 'gtip-karti-' + kod
    setTabs((prev) => {
      const tab: Tab = { key, label: 'GTİP Kartı - ' + kod, moduleKey: 'siparis', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openYeniGtip = useCallback(() => {
    const key = 'gtip-karti-yeni'
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Yeni GTİP Kartı', moduleKey: 'siparis', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openAksesuarTipiKarti = useCallback((id: number) => {
    const key = 'aksesuar-tipi-karti-' + id
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Aksesuar Tipi Kartı - ' + id, moduleKey: 'stok', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openYeniAksesuarTipi = useCallback(() => {
    const key = 'aksesuar-tipi-karti-yeni'
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Yeni Aksesuar Tipi Kartı', moduleKey: 'stok', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openSiparisKarti = useCallback((id: number) => {
    const key = 'siparis-karti-' + id
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Sipariş Kartı - ' + id, moduleKey: 'siparis', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openYeniSiparis = useCallback(() => {
    const key = 'siparis-karti-yeni'
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Yeni Sipariş', moduleKey: 'siparis', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openAksesuarKarti = useCallback((kod: string) => {
    const key = 'aksesuar-karti-' + kod
    setTabs((prev) => {
      const tab: Tab = { key, label: 'Aksesuar Kartı - ' + kod, moduleKey: 'stok', isForm: true }
      const exists = prev.find((t) => t.key === key)
      if (!exists) return [...prev, tab]
      return prev
    })
    setActiveTab(key)
  }, [])

  const openYeniAksesuar = useCallback((tipId?: number, tipAd?: string) => {
    const key = tipId ? `aksesuar-karti-yeni-${tipId}` : 'aksesuar-karti-yeni'
    const label = tipAd ? `Yeni ${tipAd}` : 'Yeni Aksesuar Kartı'
    setTabs((prev) => {
      const tab: Tab = { key, label, moduleKey: 'stok', isForm: true }
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
    if (tab.key === 'malzeme-yonetim-parametreleri') {
      return <MalzemeYonetimParametreleri />
    }
    if (tab.key === 'form-tasarimi') {
      return <FormTasarimi />
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
    if (tab.key === 'iplik-kartlari') {
      return <IplikListesi onSelect={openIplikKarti} onNew={openYeniIplik} />
    }
    if (tab.key === 'iplik-karti-yeni') {
      return <IplikKarti isNew />
    }
    if (tab.key.startsWith('iplik-karti-')) {
      return <IplikKarti kod={tab.key.replace('iplik-karti-', '')} />
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
    if (tab.key === 'renk-kartlari') {
      return <RenkListesi onSelect={openRenkKarti} onNew={openYeniRenk} />
    }
    if (tab.key === 'renk-karti-yeni') {
      return <RenkKarti isNew />
    }
    if (tab.key.startsWith('renk-karti-')) {
      return <RenkKarti kod={tab.key.replace('renk-karti-', '')} />
    }
    if (tab.key === 'doviz-tanimlari') {
      return <DovizListesi onSelect={openDovizKarti} onNew={openYeniDoviz} />
    }
    if (tab.key === 'doviz-karti-yeni') {
      return <DovizKarti isNew />
    }
    if (tab.key.startsWith('doviz-karti-')) {
      return <DovizKarti kod={tab.key.replace('doviz-karti-', '')} />
    }
    if (tab.key === 'boyahane-renk-kartlari') {
      return <BoyahaneRenkListesi onSelect={openBoyahaneRenkKarti} onNew={openYeniBoyahaneRenk} />
    }
    if (tab.key === 'boyahane-renk-karti-yeni') {
      return <BoyahaneRenkKarti isNew />
    }
    if (tab.key.startsWith('boyahane-renk-karti-')) {
      return <BoyahaneRenkKarti kod={tab.key.replace('boyahane-renk-karti-', '')} />
    }
    if (tab.key === 'model-kartlari') {
      return <ModelListesi onSelect={openModelKarti} onNew={openYeniModel} />
    }
    if (tab.key === 'model-karti-yeni') {
      return <ModelKarti isNew />
    }
    if (tab.key.startsWith('model-karti-')) {
      return <ModelKarti kod={tab.key.replace('model-karti-', '')} />
    }
    if (tab.key === 'marka-kartlari') {
      return <MarkaListesi onSelect={openMarkaKarti} onNew={openYeniMarka} />
    }
    if (tab.key === 'marka-karti-yeni') {
      return <MarkaKarti isNew />
    }
    if (tab.key.startsWith('marka-karti-')) {
      return <MarkaKarti kod={tab.key.replace('marka-karti-', '')} />
    }
    if (tab.key === 'grup-kartlari') {
      return <GrupListesi onSelect={openGrupKarti} onNew={openYeniGrup} />
    }
    if (tab.key === 'grup-karti-yeni') {
      return <GrupKarti isNew />
    }
    if (tab.key.startsWith('grup-karti-')) {
      return <GrupKarti kod={tab.key.replace('grup-karti-', '')} />
    }
    if (tab.key === 'beden-tanimlari') {
      return <BedenListesi onSelect={openBedenKarti} onNew={openYeniBeden} />
    }
    if (tab.key === 'beden-tanim-yeni') {
      return <BedenKarti isNew />
    }
    if (tab.key.startsWith('beden-tanim-')) {
      return <BedenKarti kod={tab.key.replace('beden-tanim-', '')} />
    }
    if (tab.key === 'gtip-tanimlari') {
      return <GtipListesi onSelect={openGtipKarti} onNew={openYeniGtip} />
    }
    if (tab.key === 'gtip-karti-yeni') {
      return <GtipKarti isNew />
    }
    if (tab.key.startsWith('gtip-karti-')) {
      return <GtipKarti kod={tab.key.replace('gtip-karti-', '')} />
    }
    if (tab.key === 'aksesuar-tipi-kartlari') {
      return <AksesuarTipiListesi onSelect={openAksesuarTipiKarti} onNew={openYeniAksesuarTipi} />
    }
    if (tab.key === 'aksesuar-tipi-karti-yeni') {
      return <AksesuarTipiKarti isNew />
    }
    if (tab.key.startsWith('aksesuar-tipi-karti-')) {
      return <AksesuarTipiKarti id={Number(tab.key.replace('aksesuar-tipi-karti-', ''))} />
    }
    if (tab.key === 'aksesuar-kartlari') {
      return <AksesuarListesi onSelect={openAksesuarKarti} onNew={openYeniAksesuar} onNewTipi={openYeniAksesuarTipi} />
    }
    if (tab.key === 'aksesuar-karti-yeni') {
      return <AksesuarKarti isNew />
    }
    if (tab.key.startsWith('aksesuar-karti-yeni-')) {
      const tipId = Number(tab.key.replace('aksesuar-karti-yeni-', ''))
      return <AksesuarKarti isNew selectedTipId={tipId} />
    }
    if (tab.key.startsWith('aksesuar-karti-')) {
      return <AksesuarKarti kod={tab.key.replace('aksesuar-karti-', '')} />
    }
    if (tab.key === 'siparis-girisi') {
      return <SiparisGirisi onSelect={openSiparisKarti} onNew={openYeniSiparis} />
    }
    if (tab.key === 'siparis-karti-yeni') {
      return <SiparisKarti isNew />
    }
    if (tab.key.startsWith('siparis-karti-')) {
      return <SiparisKarti id={Number(tab.key.replace('siparis-karti-', ''))} />
    }
    if (tab.key === 'satis-irsaliyeleri') {
      return <IrsaliyeListesi onNew={openYeniIrsaliye} onSelect={openIrsaliyeKarti} />
    }
    if (tab.key === 'satinalma-irsaliyeleri') {
      return <IrsaliyeListesi mod="satinalma" onNew={openYeniIrsaliye} onSelect={openIrsaliyeKarti} />
    }
    if (tab.key.startsWith('satis-irsaliye-yeni-')) {
      const match = tab.key.match(/^satis-irsaliye-yeni-(\d+)(?:-ft(\d+))?$/)
      const irsaliyeTipi = match?.[1] ?? tab.key.replace('satis-irsaliye-yeni-', '')
      const fasonTipiId = match?.[2] ? Number(match[2]) : null
      return <IrsaliyeKarti irsaliyeTipi={irsaliyeTipi} fasonTipiId={fasonTipiId} />
    }
    if (tab.key.startsWith('satis-irsaliye-karti-')) {
      const irsaliyeId = Number(tab.key.replace('satis-irsaliye-karti-', ''))
      return <IrsaliyeKarti id={irsaliyeId} irsaliyeTipi={tab.irsaliyeTipi} onDeleted={() => handleTabClose(tab.key)} />
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
