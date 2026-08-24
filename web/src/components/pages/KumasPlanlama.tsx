'use client'

import { Input, App, Dropdown, Modal, Table } from 'antd'
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
} from '@ant-design/icons'
import { useCallback, useState, useMemo, useEffect, useRef } from 'react'
import type { ColDef, CellContextMenuEvent } from 'ag-grid-community'
import DataGrid, { DataGridHandle } from '@/components/shared/DataGrid'
import { tedarikApi, type KumasPlanlamaSatir, type KumasHareketSatiri } from '@/lib/tedarik-api'
import { fasonTipiApi, parseKategoriler, type FasonTipi } from '@/lib/fason-tipi-api'
import type { IrsaliyeBaslangicKalem } from '@/components/pages/IrsaliyeKarti'

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
}

export default function KumasPlanlama({ onYeniSatinalmaSiparis }: { onYeniSatinalmaSiparis?: (kalemler: IrsaliyeBaslangicKalem[]) => void }) {
  const [satirlar, setSatirlar] = useState<KumasPlanlamaSatir[]>([])
  const [arama, setArama] = useState('')
  const [fasonTipleri, setFasonTipleri] = useState<FasonTipi[]>([])
  const { message } = App.useApp()
  const gridRef = useRef<DataGridHandle>(null)
  const [hareketSatir, setHareketSatir] = useState<KumasPlanlamaSatir | null>(null)
  const [hareketler, setHareketler] = useState<KumasHareketSatiri[]>([])
  const [hareketLoading, setHareketLoading] = useState(false)

  const hareketAc = useCallback((r: KumasPlanlamaSatir) => {
    setHareketSatir(r)
    setHareketler([])
    setHareketLoading(true)
    tedarikApi
      .planlamaKumasHareketler(r.siparisNo, r.malzemeKod)
      .then(setHareketler)
      .catch((err: unknown) =>
        message.error('Hareketler yüklenemedi: ' + (err instanceof Error ? err.message : String(err))),
      )
      .finally(() => setHareketLoading(false))
  }, [message])

  const hareketColumns = useMemo<ColumnsType<KumasHareketSatiri>>(() => [
    {
      title: 'Fiş No',
      dataIndex: 'fisNo',
      width: 130,
    },
    {
      title: 'Fiş Tipi',
      dataIndex: 'fisTipi',
      width: 150,
      render: (v: string) => fisTipiAdlari[v] ?? v,
    },
    {
      title: 'Tarih',
      dataIndex: 'fisTarihi',
      width: 100,
      render: (v: string) => (v ? new Date(v).toLocaleDateString('tr-TR') : ''),
    },
    {
      title: 'Miktar',
      dataIndex: 'miktar',
      width: 110,
      align: 'right',
      render: (v: number, r) =>
        Number(v).toLocaleString('tr-TR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) +
        (r.birim ? ' ' + r.birim : ''),
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
    tedarikApi
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
  ], [])

  const sorguMetni = arama.trim() ? ` - "${arama.trim()}"` : ''

  const contextMenuItems: MenuProps['items'] = [
    { key: 'satinalma-talimat', label: 'Satın Alma Talimatı Oluştur', icon: <ShoppingCartOutlined /> },
    { key: 'mal-alim-irsaliye', label: 'Mal Alım İrsaliyesi Oluştur', icon: <InboxOutlined /> },
    {
      key: 'fason',
      label: 'Fason İşlemleri',
      icon: <ApartmentOutlined />,
      children: fasonTipleri
        .filter((f) => parseKategoriler(f.kategoriler).includes('kumas'))
        .map((f) => ({ key: `fason:${f.id}`, label: f.ad })),
    },
    { key: 'uretime-cikis', label: 'Üretime Çıkış İrsaliyesi Oluştur', icon: <ExportOutlined /> },
    { type: 'divider' },
    { key: 'hareket-detaylari', label: 'Hareket Detayları', icon: <ProfileOutlined /> },
    { key: 'renkler', label: 'Renkler', icon: <BgColorsOutlined /> },
  ]

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'satinalma-talimat') {
      const secili = gridRef.current?.api?.getSelectedRows() as KumasPlanlamaSatir[] | undefined
      if (!secili || secili.length === 0) {
        message.warning('Önce satır seçin (çoklu seçim için Ctrl+click)')
        return
      }
      const kalemler: IrsaliyeBaslangicKalem[] = secili.map((r) => ({
        malzemeKod: r.malzemeKod,
        malzemeAd: r.malzemeAd,
        miktar: Number(r.gerekenMiktar) || 0,
        birim: r.birim || 'mt',
        aciklama: `${r.siparisNo}${r.modelKod ? ' - ' + r.modelKod : ''}`,
      }))
      onYeniSatinalmaSiparis?.(kalemler)
      return
    }
    if (key === 'mal-alim-irsaliye') {
      message.info('Mal Alım İrsaliyesi yakında')
      return
    }
    if (key === 'uretime-cikis') {
      message.info('Üretime Çıkış İrsaliyesi yakında')
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
      const fason = fasonTipleri.find((f) => `fason:${f.id}` === key)
      message.info(`${fason?.ad ?? 'Fason'} işlemi yakında`)
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
                enableRowSelection
                onCellContextMenu={(e: CellContextMenuEvent<KumasPlanlamaSatir>) => {
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
            ? `Hareket Detayları - ${hareketSatir.siparisNo} / ${hareketSatir.malzemeKod}`
            : 'Hareket Detayları'
        }
      >
        <Table<KumasHareketSatiri>
          size="small"
          columns={hareketColumns}
          dataSource={hareketler}
          loading={hareketLoading}
          rowKey={(r, i) => `${r.fisNo}-${r.fisTipi}-${i}`}
          pagination={{ pageSize: 25, size: 'small', showSizeChanger: false }}
          locale={{ emptyText: 'Hareket bulunamadı' }}
        />
      </Modal>
    </>
  )
}