'use client'

import { Input, Select, Button, Tag, Dropdown, App } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, ReloadOutlined, SearchOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined, FileTextOutlined } from '@ant-design/icons'
import { useState, useMemo, useEffect } from 'react'
import type { ColDef, CellDoubleClickedEvent, CellContextMenuEvent, SelectionChangedEvent } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { irsaliyeApi, type Irsaliye } from '@/lib/irsaliye-api'
import { eIrsaliyeApi } from '@/lib/e-irsaliye-api'
import { hataMetni } from '@/lib/hata'
import EIrsaliyeOnizlemeModal from './EIrsaliyeOnizlemeModal'
import RaporSecimModal from '@/components/shared/RaporSecimModal'
import { fasonTipiApi, type FasonTipi } from '@/lib/fason-tipi-api'
import YeniButonu, { useYeniYetkisi } from '@/components/shared/YeniButonu'

interface IrsaliyeRow {
  key: string
  id: number
  irsaliyeTipi: string
  irsaliyeNo: string
  irsaliyeTarih: string
  cariHesap: string
  depo: string
  sevkNo: string
  faturaNo: string
  aciklama: string
  irsaliyeToplam: number
  eIrsaliye: string
  eIrsaliyeDurum: string | null
  eIrsaliyeNo: string | null
  kayitEden: string
  onaylandi: boolean
  tamamlandi: boolean
}

const formatTarih = (d: string | null) => {
  if (!d) return '-'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '-'
  return dt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const mapIrsaliye = (i: Irsaliye): IrsaliyeRow => {
  const irsaliyeToplam = (i.kalemler ?? []).reduce((acc, k) => acc + (Number(k.satirTutari) || 0), 0)
  return {
    key: String(i.id),
    id: i.id,
    irsaliyeTipi: i.irsaliyeTipi,
    irsaliyeNo: i.irsaliyeNo,
    irsaliyeTarih: formatTarih(i.irsaliyeTarihi),
    cariHesap: i.cariHesap?.ad ?? '',
    depo: i.depo?.kod ?? '',
    sevkNo: i.sevkNo ?? '',
    faturaNo: i.faturaNo ?? '',
    aciklama: i.aciklama ?? '',
    irsaliyeToplam,
    // 201 ve 202 talimat/sipariş belgeleri: durum dili "Teslim Alındı / Kesinleşti"
    eIrsaliye: i.tamamlandi
      ? (i.irsaliyeTipi === '201' || i.irsaliyeTipi === '202' ? 'Teslim Alındı' : 'Tamamlandı')
      : i.onaylandi
        ? (i.irsaliyeTipi === '201' || i.irsaliyeTipi === '202' ? 'Kesinleşti' : 'Onaylandı')
        : 'Taslak',
    eIrsaliyeDurum: i.eIrsaliyeDurum ?? null,
    eIrsaliyeNo: i.eIrsaliyeNo ?? null,
    kayitEden: i.kayitYapan ?? '-',
    onaylandi: !!i.onaylandi,
    tamamlandi: !!i.tamamlandi,
  }
}

const satisIrsaliyeTipiMap: Record<string, string> = {
  '2': '2-Perakende Satış İade İrsaliyesi',
  '3': '3-Toptan Satış İade İrsaliyesi',
  '4': '4-Konsinye Çıkış İade İrsaliyesi',
  '8': '8-Konsinye Satır İrsaliyesi',
  '12': '12-Fason Çıkış İade İrsaliyesi',
  '23': '23-Verilen Hizmet İadesi',
  '120': '120-Toptan Satış İrsaliyesi',
  '121': '121-Perakende Satır İrsaliyesi',
  '123': '123-Konsinye Çıkış İrsaliyesi',
  '125': '125-Fason Giriş İrsaliyesi',
  '126': '126-Verilen Fiyat Farkı İrsaliyesi',
  '134': '134-Fasona Çıkış İrsaliyesi',
  '138': '138-Verilen Hizmet İrsaliyesi',
  '192': '192-Serbest Meslek Makbuzu',
}

const satinalmaIrsaliyeTipiMap: Record<string, string> = {
  '1': '1-Mal Alım İrsaliyesi',
  '5': '5-Konsinye Giriş İrsaliyesi',
  '6': '6-Fasona Giriş İrsaliyesi',
  '7': '7-Alınan Fiyat Farkı İrsaliyesi',
  '9': '9-Müstahsil İrsaliyesi',
  '11': '11-Fasondan Giriş İrsaliyesi',
  '22': '22-Alınan Hizmet İrsaliyesi',
  '92': '92-Serbest Meslek Makbuzu',
  '122': '122-Mal Alım İade İrsaliyesi',
  '124': '124-Konsinye Giriş İade İrsaliyesi',
  '133': '133-Fasona Giriş İade İrsaliyesi',
  '139': '139-Alınan Hizmet İadesi',
}

const satinalmaSiparisTipiMap: Record<string, string> = {
  '201': '201-Satın Alma Siparişi',
  // 202 stok etkisiz talimat belgesidir (rapor.service.ts giriş/çıkış listesinde yok).
  '202': '202-Fason Talimatı',
}

const irsaliyeTipiMap: Record<string, string> = { ...satisIrsaliyeTipiMap, ...satinalmaIrsaliyeTipiMap, ...satinalmaSiparisTipiMap }
const satisTipleri = Object.keys(satisIrsaliyeTipiMap)
const satinalmaTipleri = Object.keys(satinalmaIrsaliyeTipiMap)
const satinalmaSiparisTipleri = Object.keys(satinalmaSiparisTipiMap)
// Fason hareket fişleri: yalnızca 202-Fason Talimatı (201-Satın Alma Siparişini çıkarır).
const fasonHareketTipleri = ['202']

const eIrsaliyeDurumRengi = (durum: string | null) => {
  if (durum === 'Dosya Gönderildi') return 'green'
  if (durum === 'İptal') return 'red'
  if (durum === 'Dosya Oluşturuldu') return 'blue'
  return 'default'
}

interface IrsaliyeListesiProps {
  mod?: 'satis' | 'satinalma' | 'satinalma-siparis' | 'fason-hareket'
  onNew?: (irsaliyeTipi: string, fasonTipiId?: number | null) => void
  onSelect?: (info: { id: number; irsaliyeTipi: string; irsaliyeNo: string; ekranAdi?: string }) => void
  onCreateFatura?: (info: { faturaTipi: string; irsaliyeIds: number[]; ekranAdi?: string }) => void
}

// Fason alt tipi seçilebilen fiş tipleri (yeni kayıtta Fason Tanımı Select açılır).
// 202-Fason Talimatı alt tipi buradan gelir; 201-Satın Alma Siparişinin alt tipi yoktur.
const fasonFisTipleri = {
  satis: ['12', '125', '134'],
  satinalma: ['6', '11', '133'],
  'satinalma-siparis': ['202'],
  'fason-hareket': ['202'],
}

export default function IrsaliyeListesi({ mod = 'satis', onNew, onSelect, onCreateFatura }: IrsaliyeListesiProps) {
  const yeniIzinli = useYeniYetkisi().izinli
  const gorselTipler = mod === 'satinalma' ? satinalmaTipleri : mod === 'satinalma-siparis' ? satinalmaSiparisTipleri : mod === 'fason-hareket' ? fasonHareketTipleri : satisTipleri
  const irsaliyeTipiOptions = gorselTipler.map((value) => ({ value, label: irsaliyeTipiMap[value] }))
  const baslik = mod === 'satinalma' ? 'Satın Alma İrsaliyeleri' : mod === 'satinalma-siparis' ? 'Satın Alma Siparişleri' : mod === 'fason-hareket' ? 'Fason Hareket Fişleri' : 'Satış İrsaliyeleri'
  const ekranAdi = mod === 'satinalma' ? 'satinalma-irsaliyeleri' : mod === 'satinalma-siparis' ? 'satinalma-siparis' : mod === 'fason-hareket' ? 'fason-hareket' : 'satis-irsaliyeleri'
  const [data, setData] = useState<IrsaliyeRow[]>([])
  const [loading, setLoading] = useState(false)
  const [yeniIrsaliyeTipi, setYeniIrsaliyeTipi] = useState(mod === 'satinalma' ? '1' : mod === 'satinalma-siparis' ? '201' : mod === 'fason-hareket' ? '202' : '120')
  const [yeniFasonTipiId, setYeniFasonTipiId] = useState<number | null>(null)
  const [fasonTipleri, setFasonTipleri] = useState<FasonTipi[]>([])
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [raporModalAcik, setRaporModalAcik] = useState(false)
  const [eIrsaliyeModal, setEIrsaliyeModal] = useState<{ open: boolean; fisId: number | null; otomatik: boolean; yeniden: boolean }>({
    open: false,
    fisId: null,
    otomatik: false,
    yeniden: false,
  })
  const { modal, message } = App.useApp()
  const seciliRow = data.find((d) => d.key === selectedRow) ?? null

  const handleNew = () => onNew?.(yeniIrsaliyeTipi, fasonFisTipleri[mod].includes(yeniIrsaliyeTipi) ? yeniFasonTipiId : null)

  useEffect(() => {
    fasonTipiApi
      .list()
      .then((list) => setFasonTipleri(list.filter((f) => f.kullanimda)))
      .catch(() => setFasonTipleri([]))
  }, [])

  useEffect(() => {
    setYeniFasonTipiId(null)
  }, [yeniIrsaliyeTipi])

  const handleSil = () => {
    const r = data.find((d) => d.key === selectedRow)
    if (!r) return
    modal.confirm({
      title: 'İrsaliyeyi Sil',
      content: `${irsaliyeTipiMap[r.irsaliyeTipi] || r.irsaliyeTipi} - ${r.irsaliyeNo} irsaliyesini silmek istediğinize emin misiniz?`,
      okText: 'Evet, sil',
      okButtonProps: { danger: true },
      cancelText: 'Vazgeç',
      onOk: async () => {
        try {
          await irsaliyeApi.remove(r.id)
          message.success('İrsaliye silindi')
          load()
         } catch (err: unknown) {
           message.error('İrsaliye silinirken hata: ' + ((err as Error)?.message ?? String(err)))
        }
      },
    })
  }

  const load = () => {
    setLoading(true)
    const tipler = new Set(mod === 'satinalma' ? satinalmaTipleri : mod === 'satinalma-siparis' ? satinalmaSiparisTipleri : mod === 'fason-hareket' ? fasonHareketTipleri : satisTipleri)
    irsaliyeApi
      .list()
      .then((res) => setData(res.filter((i) => tipler.has(String(i.irsaliyeTipi))).map(mapIrsaliye)))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const eIrsaliyeAc = () => {
    const r = seciliRow
    if (!r) return
    const iptalMi = r.eIrsaliyeDurum === 'İptal'
    if (!r.eIrsaliyeNo || iptalMi) {
      modal.confirm({
        title: 'e-İrsaliye Oluştur',
        content: iptalMi
          ? `${r.eIrsaliyeNo} numaralı e-İrsaliye iptal edilmiş. Yeni belge no ve ETTN ile oluşturulacak. Devam?`
          : `${r.irsaliyeNo} numaralı fiş için e-İrsaliye oluşturulacak ve belge numarası alınacak. Onaylıyor musunuz?`,
        okText: 'Oluştur',
        cancelText: 'Vazgeç',
        onOk: () => setEIrsaliyeModal({ open: true, fisId: r.id, otomatik: true, yeniden: iptalMi }),
      })
      return
    }
    if (r.eIrsaliyeDurum === 'Dosya Gönderildi') {
      message.warning('Gönderilmiş e-İrsaliye yeniden oluşturulamaz; belgenin içeriği değiştirilemez')
      return
    }
    modal.confirm({
      title: 'e-İrsaliye Yeniden Oluştur',
      content: `${r.eIrsaliyeNo} numaralı e-İrsaliye, güncel fiş bilgileriyle yeniden üretilecek. Belge no ve ETTN değişmez. Devam?`,
      okText: 'Yeniden Oluştur',
      cancelText: 'Vazgeç',
      onOk: () => setEIrsaliyeModal({ open: true, fisId: r.id, otomatik: true, yeniden: true }),
    })
  }

  const eIrsaliyeGonder = () => {
    const r = seciliRow
    if (!r?.eIrsaliyeNo) {
      message.warning('Önce e-İrsaliye oluşturmalısınız')
      return
    }
    if (r.eIrsaliyeDurum === 'İptal') {
      message.warning('İptal edilmiş e-İrsaliye gönderilemez; önce yeniden oluşturun')
      return
    }
    modal.confirm({
      title: 'e-İrsaliye Gönder',
      content: `${r.eIrsaliyeNo} numaralı e-İrsaliye gönderilsin mi? (simülasyon)`,
      okText: 'Gönder',
      cancelText: 'Vazgeç',
      onOk: async () => {
        try {
          await eIrsaliyeApi.gonder(r.id)
          message.success('e-İrsaliye gönderildi (simülasyon)')
          load()
        } catch (e) {
          message.error(hataMetni(e))
        }
      },
    })
  }

  const eIrsaliyeIptal = () => {
    const r = seciliRow
    if (!r?.eIrsaliyeNo) return
    if (r.eIrsaliyeDurum !== 'Dosya Oluşturuldu' && r.eIrsaliyeDurum !== 'Dosya Gönderildi') {
      message.warning('e-İrsaliye bu durumda iptal edilemez')
      return
    }
    modal.confirm({
      title: 'e-İrsaliyeyi Boşa Düşür',
      content: `${r.eIrsaliyeNo} numaralı e-İrsaliye iptal edilecek. Belge listede "İptal" durumunda kalır; yeniden oluşturulursa yeni belge no ve ETTN alınır. Devam?`,
      okText: 'İptal Et',
      okButtonProps: { danger: true },
      cancelText: 'Vazgeç',
      onOk: async () => {
        try {
          await eIrsaliyeApi.iptal(r.id)
          message.success('e-İrsaliye iptal edildi')
          load()
        } catch (e) {
          message.error(hataMetni(e))
        }
      },
    })
  }

  const eIrsaliyeBelgeNoSifirla = () => {
    const r = seciliRow
    if (!r) return
    if (r.eIrsaliyeDurum !== 'Dosya Oluşturuldu') {
      message.warning('Yalnızca gönderilmemiş belgenin numarası sıfırlanabilir')
      return
    }
    modal.confirm({
      title: 'Belge No Sıfırla',
      content: `${r.eIrsaliyeNo} numaralı gönderilmemiş belge iptal edilecek ve sayaç 1 geri alınacak; numara bir sonraki e-İrsaliye'de kullanılacak. Bu numaradan sonra belge varsa işlem yapılamaz. Devam?`,
      okText: 'Sıfırla',
      okButtonProps: { danger: true },
      cancelText: 'Vazgeç',
      onOk: async () => {
        try {
          await eIrsaliyeApi.belgeNoSifirla(r.id)
          message.success('Belge no sıfırlandı; numara sayaçtan geri alındı')
          load()
        } catch (e) {
          message.error(hataMetni(e))
        }
      },
    })
  }

  const eIrsaliyeMenuItems: NonNullable<MenuProps['items']> = [
    {
      key: 'e-irsaliye-goruntule',
      label: 'e-İrsaliye Görüntüle',
      disabled: !seciliRow?.eIrsaliyeNo || seciliRow?.eIrsaliyeDurum === 'İptal',
      onClick: () => {
        if (!seciliRow) return
        setEIrsaliyeModal({ open: true, fisId: seciliRow.id, otomatik: false, yeniden: false })
      },
    },
    {
      key: 'e-irsaliye-olustur',
      label:
        seciliRow?.eIrsaliyeNo && seciliRow?.eIrsaliyeDurum !== 'İptal'
          ? 'Yeniden Oluştur'
          : 'e-İrsaliye Oluştur',
      disabled: !seciliRow,
      onClick: eIrsaliyeAc,
    },
    {
      key: 'e-irsaliye-gonder',
      label: 'Gönder',
      disabled:
        !seciliRow?.eIrsaliyeNo ||
        seciliRow?.eIrsaliyeDurum === 'Dosya Gönderildi' ||
        seciliRow?.eIrsaliyeDurum === 'İptal',
      onClick: eIrsaliyeGonder,
    },
    {
      key: 'e-irsaliye-belge-no-sifirla',
      label: 'Belge No Sıfırla',
      disabled: !seciliRow?.eIrsaliyeNo || seciliRow?.eIrsaliyeDurum !== 'Dosya Oluşturuldu',
      onClick: eIrsaliyeBelgeNoSifirla,
    },
    {
      key: 'e-irsaliye-iptal',
      label: 'Boşa Düşür (İptal)',
      danger: true,
      disabled: !seciliRow?.eIrsaliyeNo || seciliRow?.eIrsaliyeDurum === 'İptal',
      onClick: eIrsaliyeIptal,
    },
  ]

  const handleOnay = async (onaylandi: boolean) => {
    const r = data.find((d) => d.key === selectedRow)
    if (!r || r.irsaliyeTipi !== '201') return
    try {
      await irsaliyeApi.setOnay(r.id, onaylandi)
      message.success(onaylandi ? `${r.irsaliyeNo} onaylandı (Kesinleşti)` : `${r.irsaliyeNo} onayı kaldırıldı (Taslak)`)
      load()
    } catch (err: unknown) {
      message.error('Onay işlemi hatası: ' + ((err as Error)?.message ?? String(err)))
    }
  }

  const contextMenuItems: MenuProps['items'] = [
    { key: 'yeni', label: 'Yeni', icon: <PlusOutlined />, disabled: !yeniIzinli, onClick: handleNew },
    { key: 'duzenle', label: 'Düzenle', disabled: !selectedRow, onClick: () => { const r = data.find((d) => d.key === selectedRow); if (r) onSelect?.({ ...r, ekranAdi }) } },
    ...(mod === 'satis'
      ? [{
          key: 'e-irsaliye-islemleri',
          label: 'e-İrsaliye İşlemleri',
          icon: <FileTextOutlined />,
          disabled: !selectedRow,
          children: eIrsaliyeMenuItems,
        }]
      : []),
    ...(mod !== 'satinalma-siparis'
      ? [{
          key: 'fatura-olustur',
          label: 'Fatura Oluştur',
          disabled: !selectedRow,
          onClick: () => {
            const r = data.find((d) => d.key === selectedRow)
            if (r) onCreateFatura?.({ faturaTipi: r.irsaliyeTipi, irsaliyeIds: [r.id], ekranAdi })
          },
        }]
      : (() => {
          const r = data.find((d) => d.key === selectedRow)
          const is201 = !!r && r.irsaliyeTipi === '201'
          return [
            {
              key: 'onayla',
              label: 'Onayla (Kesinleşti)',
              icon: <CheckCircleOutlined />,
              disabled: !is201 || r!.onaylandi,
              onClick: () => handleOnay(true),
            },
            {
              key: 'onay-kaldir',
              label: 'Onayı Kaldır (Taslak)',
              icon: <CloseCircleOutlined />,
              disabled: !is201 || !r!.onaylandi,
              onClick: () => handleOnay(false),
            },
          ]
        })()),
    { type: 'divider' },
    { key: 'sil', label: 'Sil', danger: true, disabled: !selectedRow, onClick: handleSil },
  ]

  const columns = useMemo<ColDef<IrsaliyeRow>[]>(() => [
    {
      headerName: 'İrsaliye Tipi', field: 'irsaliyeTipi', width: 150, resizable: true,
      valueFormatter: (p) => irsaliyeTipiMap[p.value as string] || p.value,
    },
    {
      headerName: 'İrsaliye No', field: 'irsaliyeNo', width: 90, resizable: true,
      cellClass: '!text-[#f57c00] !font-medium',
    },
    {
      headerName: 'İrsaliye Tarihi', field: 'irsaliyeTarih', width: 100, resizable: true,
    },
    {
      headerName: 'Cari Hesap', field: 'cariHesap', flex: 1, minWidth: 120, resizable: true,
      valueFormatter: (p) => p.value || '-',
    },
    {
      headerName: 'Depo', field: 'depo', width: 100, resizable: true,
      valueFormatter: (p) => p.value || '-',
    },
    {
      headerName: 'Sevk No', field: 'sevkNo', width: 100, resizable: true,
      valueFormatter: (p) => p.value || '-',
    },
    ...((mod === 'satinalma'
      ? [{
          headerName: 'Fatura No', field: 'faturaNo', width: 110, resizable: true,
          valueFormatter: (p: any) => p.value || '-',
        }]
      : []) as any[]),
    {
      headerName: 'Açıklama', field: 'aciklama', width: 150, resizable: true,
    },
    {
      headerName: 'İrsaliye Toplamı', field: 'irsaliyeToplam', width: 120, resizable: true,
      type: 'rightAligned',
      valueFormatter: (p) =>
        `${(p.value as number).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`,
    },
    ...(mod === 'satis'
      ? [
          {
            headerName: 'e-İrsaliye No', field: 'eIrsaliyeNo', width: 150, resizable: true,
            valueFormatter: (p: any) => p.value || '-',
          },
          {
            headerName: 'e-İrsaliye', field: 'eIrsaliyeDurum', width: 130, resizable: true,
            cellRenderer: (p: { value: string | null }) =>
              p.value ? (
                <Tag color={eIrsaliyeDurumRengi(p.value)} className="!text-[11px]">
                  {p.value}
                </Tag>
              ) : (
                <span className="!text-[#9ca3af]">-</span>
              ),
          },
        ]
      : []),
    {
      headerName: 'Durum', field: 'eIrsaliye', width: 110, resizable: true,
      cellRenderer: (p: { value: string }) => (
        <Tag color={p.value === 'Tamamlandı' || p.value === 'Teslim Alındı' ? 'green' : p.value === 'Onaylandı' || p.value === 'Kesinleşti' ? 'blue' : 'default'} className="!text-[11px]">
          {p.value}
        </Tag>
      ),
    },
    {
      headerName: 'Kayıt Eden', field: 'kayitEden', width: 110, resizable: true,
    },
  ], [mod])

  return (
    <>
    <Dropdown menu={{ items: contextMenuItems }} trigger={['contextMenu']}>
      <div className="!p-3 !flex !flex-col !h-full">
        <EIrsaliyeOnizlemeModal
          open={eIrsaliyeModal.open}
          fisId={eIrsaliyeModal.fisId}
          otomatikOlustur={eIrsaliyeModal.otomatik}
          yenidenOlustur={eIrsaliyeModal.yeniden}
          onClose={() => setEIrsaliyeModal((m) => ({ ...m, open: false, yeniden: false }))}
          onChanged={load}
        />
        <div className="!flex !items-center !justify-between !mb-3">
          <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
            {baslik}
          </div>
          <div className="!flex !items-center !gap-1.5">
            <Input
              size="small"
              placeholder="Ara..."
              allowClear
              prefix={<SearchOutlined style={{ fontSize: 12, color: '#9ca3af' }} />}
              className="!w-52 !text-[12px]"
            />
            <Button size="small" className="!text-[12px] !h-7">Filtre</Button>
            {mod === 'fason-hareket' && (
              <Button
                size="small"
                icon={<FileTextOutlined />}
                onClick={() => setRaporModalAcik(true)}
                className="!text-[12px] !h-7"
              >
                Raporlar
              </Button>
            )}
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={load}
              className="!text-[12px] !h-7"
            />
            <YeniButonu onClick={handleNew} className="!text-[12px] !h-7" />
            <Button
              size="small"
              danger
              disabled={!selectedRow}
              icon={<DeleteOutlined />}
              onClick={handleSil}
              className="!text-[12px] !h-7"
            >
              Sil
            </Button>
          </div>
        </div>

        <div className="!flex-1 !min-h-0" style={{ minHeight: 300 }}>
          <div className="!bg-white !rounded-sm !h-full !flex !flex-col">
            <div className="!flex-1 !min-h-0" style={{ minHeight: 250 }}>
              <DataGrid
                loading={loading}
                rowData={data}
                columnDefs={columns}
                domLayout="normal"
                exportFileName={mod === 'satinalma' ? 'satinalma-irsaliyeleri' : mod === 'satinalma-siparis' ? 'satinalma-siparisleri' : 'irsaliyeleri'}
                storageKey={mod === 'satinalma' ? 'satinalmaIrsaliye' : mod === 'satinalma-siparis' ? 'satinalmaSiparis' : 'irsaliye'}
                rowSelection="single"
                onCellDoubleClicked={(e: CellDoubleClickedEvent<IrsaliyeRow>) => {
                  const row = e.data as IrsaliyeRow | undefined
                  if (row?.id != null) onSelect?.({ ...row, ekranAdi })
                }}
                onCellContextMenu={(e: CellContextMenuEvent<IrsaliyeRow>) => {
                  const row = e.data as IrsaliyeRow | undefined
                  if (row?.key) {
                    e.node?.setSelected(true)
                    setSelectedRow(row.key)
                  }
                }}
                onSelectionChanged={(e: SelectionChangedEvent<IrsaliyeRow>) => {
                  const sel = e.api.getSelectedRows()
                  setSelectedRow(sel[0]?.key ?? null)
                }}
              />
            </div>

            <div className="!border-t !border-gray-200 !px-3 !py-2 !flex !items-center !justify-between !bg-[#fafafa] !flex-shrink-0">
              <div className="!flex !items-center !gap-2 !flex-wrap">
                {mod !== 'satinalma-siparis' && (
                  <div className="!flex !items-center !gap-2">
                    <span className="!text-[11px] !text-[#9ca3af]">Yeni İrsaliye Türü:</span>
                    <Select
                      size="small"
                      value={yeniIrsaliyeTipi}
                      onChange={setYeniIrsaliyeTipi}
                      className="!w-56 !text-[12px]"
                      options={irsaliyeTipiOptions}
                    />
                  </div>
                )}
                {fasonFisTipleri[mod].includes(yeniIrsaliyeTipi) && (
                  <div className="!flex !items-center !gap-2">
                    <span className="!text-[11px] !text-[#9ca3af]">Fiş Alt Tipi:</span>
                    <Select
                      size="small"
                      value={yeniFasonTipiId ?? undefined}
                      onChange={(v) => setYeniFasonTipiId(v ?? null)}
                      placeholder="Seçiniz..."
                      className="!w-52 !text-[12px]"
                      options={fasonTipleri.map((f) => ({ value: f.id, label: f.ad }))}
                      notFoundContent="Fason tanımı bulunamadı"
                    />
                  </div>
                )}
              </div>
              <span className="!text-[11px] !text-[#9ca3af] !tabular-nums">{data.length} kayıt</span>
            </div>
          </div>
        </div>
      </div>
    </Dropdown>
    <RaporSecimModal
      open={raporModalAcik}
      ekranAdi="boyahane-bekleyenler"
      onCancel={() => setRaporModalAcik(false)}
    />
    </>
  )
}
