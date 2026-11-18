'use client'

import { Input, Select, Button, Tag, Dropdown, App } from 'antd'
import type { MenuProps } from 'antd'
import { ReloadOutlined, SearchOutlined, FileTextOutlined } from '@ant-design/icons'
import { useState, useMemo, useEffect, useRef } from 'react'
import type { ColDef, CellDoubleClickedEvent, CellContextMenuEvent, SelectionChangedEvent } from 'ag-grid-community'
import DataGrid from '@/components/shared/DataGrid'
import { eIrsaliyeApi, type EIrsaliyeListeSatiri } from '@/lib/e-irsaliye-api'
import { hataMetni } from '@/lib/hata'
import EIrsaliyeOnizlemeModal from './EIrsaliyeOnizlemeModal'

const fisTipiAdlari: Record<string, string> = {
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
  '99': '99-Sayım Farkı Noksanı',
  '130': '130-Sarf Fişi',
  '131': '131-Fire Fişi',
  '132': '132-Özel Fiş (Çıkış)',
  '135': '135-Transfer Çıkış',
  '136': '136-Karma Koli Sarf',
  '137': '137-Karma Koli Bozma',
  '140': '140-Üretime Çıkış Fişi',
}

const eIrsaliyeDurumRengi = (durum: string | null) => {
  if (durum === 'Dosya Gönderildi') return 'green'
  if (durum === 'İptal') return 'red'
  if (durum === 'Dosya Oluşturuldu') return 'blue'
  return 'default'
}

const durumSecenekleri = [
  { value: 'Dosya Oluşturuldu', label: 'Dosya Oluşturuldu' },
  { value: 'Dosya Gönderildi', label: 'Dosya Gönderildi' },
  { value: 'İptal', label: 'İptal' },
]

const formatTarih = (d: string | null) => {
  if (!d) return '-'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '-'
  return dt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

interface EIrsaliyeRow {
  key: string
  id: number
  eIrsaliyeNo: string
  eIrsaliyeDurum: string | null
  ettnNo: string
  irsaliyeTipi: string
  irsaliyeNo: string
  irsaliyeTarih: string
  cariHesap: string
  depo: string
  kayitEden: string
}

const mapSatir = (s: EIrsaliyeListeSatiri): EIrsaliyeRow => ({
  key: String(s.id),
  id: s.id,
  eIrsaliyeNo: s.eIrsaliyeNo ?? '',
  eIrsaliyeDurum: s.eIrsaliyeDurum ?? null,
  ettnNo: s.ettnNo ?? '',
  irsaliyeTipi: s.irsaliyeTipi,
  irsaliyeNo: s.irsaliyeNo ?? '',
  irsaliyeTarih: formatTarih(s.irsaliyeTarihi),
  cariHesap: s.cariHesap?.ad ?? '',
  depo: s.depo?.kod ?? '',
  kayitEden: s.kayitYapan ?? '-',
})

interface EIrsaliyeListesiProps {
  /** Sekme aktif olduğunda liste tazelenir (sekme arka planda mount kalır). */
  active?: boolean
  onFisGoruntule?: (info: { id: number; irsaliyeTipi: string; irsaliyeNo: string }) => void
}

export default function EIrsaliyeListesi({ active = true, onFisGoruntule }: EIrsaliyeListesiProps) {
  const [data, setData] = useState<EIrsaliyeRow[]>([])
  const [loading, setLoading] = useState(false)
  const [arama, setArama] = useState('')
  const [durumFiltre, setDurumFiltre] = useState<string | null>(null)
  const [tipFiltre, setTipFiltre] = useState<string | null>(null)
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const satirCtxRef = useRef(false)
  const [eIrsaliyeModal, setEIrsaliyeModal] = useState<{ open: boolean; fisId: number | null; otomatik: boolean; yeniden: boolean }>({
    open: false,
    fisId: null,
    otomatik: false,
    yeniden: false,
  })
  const { modal, message } = App.useApp()

  const secili = data.find((d) => d.key === selectedRow) ?? null

  const gorunen = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase('tr')
    return data.filter((d) => {
      if (durumFiltre && d.eIrsaliyeDurum !== durumFiltre) return false
      if (tipFiltre && d.irsaliyeTipi !== tipFiltre) return false
      if (!q) return true
      return [d.eIrsaliyeNo, d.irsaliyeNo, d.cariHesap, d.ettnNo].some((v) =>
        (v ?? '').toLocaleLowerCase('tr').includes(q),
      )
    })
  }, [data, arama, durumFiltre, tipFiltre])

  const tipSecenekleri = useMemo(() => {
    const tipler = [...new Set(data.map((d) => d.irsaliyeTipi))].sort((a, b) => Number(a) - Number(b))
    return tipler.map((t) => ({ value: t, label: fisTipiAdlari[t] || t }))
  }, [data])

  const load = () => {
    setLoading(true)
    eIrsaliyeApi
      .liste()
      .then((res) => setData(res.map(mapSatir)))
      .catch((e) => {
        setData([])
        message.error(hataMetni(e, 'e-İrsaliye listesi yüklenemedi'))
      })
      .finally(() => setLoading(false))
  }

  // Sekmeler arka planda mount kaldığı için liste yalnız aktifken tazelenir.
  useEffect(() => {
    if (active) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  const eIrsaliyeGoruntule = (r: EIrsaliyeRow | null = secili) => {
    if (!r) return
    if (r.eIrsaliyeDurum === 'İptal') {
      message.warning('İptal edilmiş e-İrsaliyenin görüntülenecek belgesi yok; sağ tık > Oluştur ile yeni belge üretin')
      return
    }
    setEIrsaliyeModal({ open: true, fisId: r.id, otomatik: false, yeniden: false })
  }

  const eIrsaliyeAc = () => {
    const r = secili
    if (!r) return
    if (r.eIrsaliyeDurum === 'Dosya Gönderildi') {
      message.warning('Gönderilmiş e-İrsaliye yeniden oluşturulamaz; belgenin içeriği değiştirilemez')
      return
    }
    const iptalMi = r.eIrsaliyeDurum === 'İptal'
    modal.confirm({
      title: iptalMi ? 'e-İrsaliye Oluştur' : 'e-İrsaliye Yeniden Oluştur',
      content: iptalMi
        ? `${r.eIrsaliyeNo} numaralı e-İrsaliye iptal edilmiş. Yeni belge no ve ETTN ile oluşturulacak. Devam?`
        : `${r.eIrsaliyeNo} numaralı e-İrsaliye, güncel fiş bilgileriyle yeniden üretilecek. Belge no ve ETTN değişmez. Devam?`,
      okText: iptalMi ? 'Oluştur' : 'Yeniden Oluştur',
      cancelText: 'Vazgeç',
      onOk: () => setEIrsaliyeModal({ open: true, fisId: r.id, otomatik: true, yeniden: true }),
    })
  }

  const eIrsaliyeGonder = () => {
    const r = secili
    if (!r) return
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
    const r = secili
    if (!r) return
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
    const r = secili
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

  const fisGoruntule = (r: EIrsaliyeRow | null = secili) => {
    if (!r) return
    onFisGoruntule?.({ id: r.id, irsaliyeTipi: r.irsaliyeTipi, irsaliyeNo: r.irsaliyeNo })
  }

  const contextMenuItems: MenuProps['items'] = [
    {
      key: 'e-irsaliye-goruntule',
      label: 'e-İrsaliye Görüntüle',
      icon: <FileTextOutlined />,
      disabled: !secili || secili.eIrsaliyeDurum === 'İptal',
      onClick: () => eIrsaliyeGoruntule(),
    },
    {
      key: 'e-irsaliye-olustur',
      label: secili?.eIrsaliyeDurum === 'İptal' ? 'Oluştur (Yeni Belge No)' : 'Yeniden Oluştur',
      disabled: !secili || secili.eIrsaliyeDurum === 'Dosya Gönderildi',
      onClick: eIrsaliyeAc,
    },
    {
      key: 'e-irsaliye-gonder',
      label: 'Gönder',
      disabled:
        !secili || secili.eIrsaliyeDurum === 'Dosya Gönderildi' || secili.eIrsaliyeDurum === 'İptal',
      onClick: eIrsaliyeGonder,
    },
    {
      key: 'e-irsaliye-belge-no-sifirla',
      label: 'Belge No Sıfırla',
      disabled: !secili || !secili.eIrsaliyeNo || secili.eIrsaliyeDurum !== 'Dosya Oluşturuldu',
      onClick: eIrsaliyeBelgeNoSifirla,
    },
    {
      key: 'e-irsaliye-iptal',
      label: 'Boşa Düşür (İptal)',
      danger: true,
      disabled: !secili || secili.eIrsaliyeDurum === 'İptal',
      onClick: eIrsaliyeIptal,
    },
    { type: 'divider' },
    {
      key: 'fis-goruntule',
      label: 'Fişi Görüntüle',
      disabled: !secili,
      onClick: () => fisGoruntule(),
    },
  ]

  const columns = useMemo<ColDef<EIrsaliyeRow>[]>(
    () => [
      {
        headerName: 'e-İrsaliye No', field: 'eIrsaliyeNo', width: 160, resizable: true,
        cellClass: '!text-[#f57c00] !font-medium',
      },
      {
        headerName: 'Durum', field: 'eIrsaliyeDurum', width: 140, resizable: true,
        cellRenderer: (p: { value: string | null }) =>
          p.value ? (
            <Tag color={eIrsaliyeDurumRengi(p.value)} className="!text-[11px]">
              {p.value}
            </Tag>
          ) : (
            <span className="!text-[#9ca3af]">-</span>
          ),
      },
      {
        headerName: 'Fiş Tipi', field: 'irsaliyeTipi', width: 170, resizable: true,
        valueFormatter: (p) => fisTipiAdlari[p.value as string] || p.value,
      },
      {
        headerName: 'Fiş No', field: 'irsaliyeNo', width: 100, resizable: true,
        cellClass: '!text-[#f57c00] !font-medium',
      },
      {
        headerName: 'Fiş Tarihi', field: 'irsaliyeTarih', width: 100, resizable: true,
        comparator: (a: any, b: any) => {
          const da = String(a ?? '').split('.').map(Number)
          const db = String(b ?? '').split('.').map(Number)
          if (da.length === 3 && db.length === 3) {
            return new Date(da[2], da[1] - 1, da[0]).getTime() - new Date(db[2], db[1] - 1, db[0]).getTime()
          }
          return String(a ?? '').localeCompare(String(b ?? ''))
        },
      },
      {
        headerName: 'Cari Hesap', field: 'cariHesap', flex: 1, minWidth: 140, resizable: true,
        valueFormatter: (p) => p.value || '-',
      },
      {
        headerName: 'ETTN', field: 'ettnNo', width: 250, resizable: true,
        cellClass: '!text-[11px] !text-[#6b7280]',
        valueFormatter: (p) => p.value || '-',
      },
      {
        headerName: 'Depo', field: 'depo', width: 100, resizable: true,
        valueFormatter: (p) => p.value || '-',
      },
      {
        headerName: 'Kayıt Eden', field: 'kayitEden', width: 110, resizable: true,
      },
    ],
    [],
  )

  return (
    <Dropdown menu={{ items: contextMenuItems }} trigger={['contextMenu']}>
      <div
        className="!p-3 !flex !flex-col !h-full"
        onContextMenu={() => {
          // Satır dışında sağ tık: seçim temizlenir, menüdeki işlemler kapanır.
          if (!satirCtxRef.current) setSelectedRow(null)
          satirCtxRef.current = false
        }}
      >
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
            e-İrsaliye Listesi
          </div>
          <div className="!flex !items-center !gap-1.5">
            <Input
              size="small"
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="e-İrsaliye no, fiş no, cari..."
              allowClear
              prefix={<SearchOutlined style={{ fontSize: 12, color: '#9ca3af' }} />}
              className="!w-64 !text-[12px]"
            />
            <Select
              size="small"
              value={tipFiltre ?? undefined}
              onChange={(v) => setTipFiltre(v ?? null)}
              placeholder="Tüm fiş tipleri"
              allowClear
              className="!w-52 !text-[12px]"
              options={tipSecenekleri}
            />
            <Select
              size="small"
              value={durumFiltre ?? undefined}
              onChange={(v) => setDurumFiltre(v ?? null)}
              placeholder="Tüm durumlar"
              allowClear
              className="!w-44 !text-[12px]"
              options={durumSecenekleri}
            />
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={load}
              className="!text-[12px] !h-7"
            />
          </div>
        </div>

        <div className="!flex-1 !min-h-0" style={{ minHeight: 300 }}>
          <div className="!bg-white !rounded-sm !h-full !flex !flex-col">
            <div className="!flex-1 !min-h-0" style={{ minHeight: 250 }}>
              <DataGrid
                loading={loading}
                rowData={gorunen}
                columnDefs={columns}
                domLayout="normal"
                exportFileName="e-irsaliye-listesi"
                storageKey="eIrsaliyeListesi"
                rowSelection="single"
                onCellDoubleClicked={(e: CellDoubleClickedEvent<EIrsaliyeRow>) => {
                  const row = e.data as EIrsaliyeRow | undefined
                  eIrsaliyeGoruntule(row ?? null)
                }}
                onCellContextMenu={(e: CellContextMenuEvent<EIrsaliyeRow>) => {
                  const row = e.data as EIrsaliyeRow | undefined
                  if (row?.key) {
                    satirCtxRef.current = true
                    e.node?.setSelected(true)
                    setSelectedRow(row.key)
                  }
                }}
                onSelectionChanged={(e: SelectionChangedEvent<EIrsaliyeRow>) => {
                  const sel = e.api.getSelectedRows()
                  setSelectedRow(sel[0]?.key ?? null)
                }}
              />
            </div>

            <div className="!border-t !border-gray-200 !px-3 !py-2 !flex !items-center !justify-between !bg-[#fafafa] !flex-shrink-0">
              <span className="!text-[11px] !text-[#9ca3af]">
                Çift tık: e-İrsaliye önizleme · Sağ tık: işlemler
              </span>
              <span className="!text-[11px] !text-[#9ca3af] !tabular-nums">{gorunen.length} kayıt</span>
            </div>
          </div>
        </div>
      </div>
    </Dropdown>
  )
}
