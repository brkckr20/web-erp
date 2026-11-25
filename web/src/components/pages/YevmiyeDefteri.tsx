'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { App, Button, DatePicker, Input, Modal, Select, Space, Typography } from 'antd'
import { EyeOutlined, PrinterOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColDef, IsFullWidthRowParams } from 'ag-grid-community'
import dayjs, { type Dayjs } from 'dayjs'
import DataGrid from '@/components/shared/DataGrid'
import { yevmiyeDefteriApi, type YevmiyeMadde } from '@/lib/yevmiye-defteri-api'
import { MUHASEBE_FIS_TIPLERI } from '@/data/muhasebe-fis-tipleri'
import { yevmiyeDefteriPdfOnizle, yevmiyeDefteriTasarimlari } from '@/lib/reports/yevmiye-defteri.report'

type GridRow = {
  kind: 'header' | 'detail' | 'footer'
  maddeNo?: number
  fisId?: number
  fisTipi?: string
  fisNo?: number
  fisTarihi?: string
  belgeNo?: string | null
  hesapKodu?: string
  hesapAdiAciklama?: string
  detay?: string
  borc?: number
  alacak?: number
  headerText?: string
}

const fmtDate = (v?: string | null) => {
  if (!v) return '-'
  const d = new Date(v)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('tr-TR')
}

const fmtMoney = (v?: number | null) => {
  const n = Number(v ?? 0)
  if (!n) return ''
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const fisTipiLabel = (tip?: string) => {
  const found = MUHASEBE_FIS_TIPLERI.find((t) => t.deger === String(tip))
  return found ? found.ad : tip ?? '-'
}

export default function YevmiyeDefteri() {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [maddeler, setMaddeler] = useState<YevmiyeMadde[]>([])
  const [baslangic, setBaslangic] = useState<Dayjs | null>(dayjs().startOf('month'))
  const [bitis, setBitis] = useState<Dayjs | null>(dayjs())
  const [fisTipi, setFisTipi] = useState<string | undefined>(undefined)
  const [kaynakModul, setKaynakModul] = useState('')
  const [ozelKod, setOzelKod] = useState('')
  const [raporModalAcik, setRaporModalAcik] = useState(false)
  const [seciliTasarim, setSeciliTasarim] = useState(yevmiyeDefteriTasarimlari[0]?.id ?? 'standart')
  const [raporYukleniyor, setRaporYukleniyor] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await yevmiyeDefteriApi.list({
        baslangic: baslangic ? baslangic.format('YYYY-MM-DD') : undefined,
        bitis: bitis ? bitis.format('YYYY-MM-DD') : undefined,
        fisTipi,
      })
      setMaddeler(data)
    } catch {
      message.error('Yevmiye defteri yüklenemedi')
      setMaddeler([])
    } finally {
      setLoading(false)
    }
  }, [baslangic, bitis, fisTipi, message])

  useEffect(() => { load() }, [load])

  const rowData = useMemo<GridRow[]>(() => {
    const rows: GridRow[] = []
    for (const m of maddeler) {
      rows.push({
        kind: 'header',
        maddeNo: m.maddeNo,
        fisId: m.fisId,
        fisTipi: m.fisTipi,
        fisNo: m.fisNo,
        fisTarihi: m.fisTarihi,
        belgeNo: m.belgeNo,
        headerText: `-- Madde No:${m.maddeNo} --  Tarih:${fmtDate(m.fisTarihi)}  ${fisTipiLabel(m.fisTipi)}  Fiş No:${String(m.fisNo).padStart(8, '0')}${m.belgeNo ? `  Belge No:${m.belgeNo}` : ''}`,
      })
      let maddeBorc = 0
      let maddeAlacak = 0
      for (const s of m.satirlar) {
        maddeBorc += Number(s.borc) || 0
        maddeAlacak += Number(s.alacak) || 0
        const adAciklama = [s.hesapAdi, s.aciklama].filter(Boolean).join(' - ')
        rows.push({
          kind: 'detail',
          fisId: m.fisId,
          hesapKodu: s.hesapKodu,
          hesapAdiAciklama: adAciklama || s.hesapAdi || '',
          detay: s.detay || '',
          borc: Number(s.borc) || 0,
          alacak: Number(s.alacak) || 0,
        })
      }
      rows.push({
        kind: 'footer',
        fisId: m.fisId,
        hesapAdiAciklama: 'Madde Toplamı',
        borc: maddeBorc,
        alacak: maddeAlacak,
      })
    }
    return rows
  }, [maddeler])

  const toplam = useMemo(() => {
    let borc = 0
    let alacak = 0
    for (const m of maddeler) {
      for (const s of m.satirlar) {
        borc += Number(s.borc) || 0
        alacak += Number(s.alacak) || 0
      }
    }
    return { borc, alacak }
  }, [maddeler])

  const columnDefs = useMemo<ColDef<GridRow>[]>(() => [
    { headerName: 'Hesap Kodu', field: 'hesapKodu', width: 150 },
    { headerName: 'Hesap Adı ve Açıklama', field: 'hesapAdiAciklama', flex: 1, minWidth: 280 },
    { headerName: 'Detay', field: 'detay', width: 180 },
    {
      headerName: 'Borç', field: 'borc', width: 130, type: 'rightAligned',
      valueFormatter: (p) => fmtMoney(p.value),
      cellStyle: (p) => p.data?.kind === 'footer' ? { fontWeight: 600 } : undefined,
    },
    {
      headerName: 'Alacak', field: 'alacak', width: 130, type: 'rightAligned',
      valueFormatter: (p) => fmtMoney(p.value),
      cellStyle: (p) => p.data?.kind === 'footer' ? { fontWeight: 600 } : undefined,
    },
  ], [])

  const raporAc = async () => {
    const targetWin = window.open('', '_blank', 'toolbar=0,menubar=0,location=0,status=0,scrollbars=1,width=1100,height=760')
    if (targetWin) {
      targetWin.document.write('<!doctype html><title>Rapor hazırlanıyor...</title><body style="font-family:sans-serif;padding:24px">Rapor hazırlanıyor...</body>')
      targetWin.document.close()
    }
    setRaporYukleniyor(true)
    try {
      await yevmiyeDefteriPdfOnizle({
        baslangic: baslangic ? baslangic.format('YYYY-MM-DD') : null,
        bitis: bitis ? bitis.format('YYYY-MM-DD') : null,
        maddeler,
      }, seciliTasarim, targetWin)
      setRaporModalAcik(false)
    } catch (err) {
      if (targetWin && !targetWin.closed) targetWin.close()
      console.error('Yevmiye raporu oluşturulamadı', err)
      message.error('Rapor oluşturulamadı')
    } finally {
      setRaporYukleniyor(false)
    }
  }

  return (
    <div className="!flex !flex-col !h-full !gap-2">
      <div className="!flex !items-center !justify-between !gap-2 !flex-wrap">
        <Space wrap>
          <DatePicker value={baslangic} onChange={setBaslangic} format="DD.MM.YYYY" placeholder="Başlangıç" />
          <DatePicker value={bitis} onChange={setBitis} format="DD.MM.YYYY" placeholder="Bitiş" />
          <Select
            allowClear
            placeholder="Fiş Tipi"
            style={{ width: 220 }}
            value={fisTipi}
            onChange={setFisTipi}
            options={MUHASEBE_FIS_TIPLERI.map((t) => ({ value: t.deger, label: `${t.deger} - ${t.ad}` }))}
          />
          <Input value={kaynakModul} onChange={(e) => setKaynakModul(e.target.value)} placeholder="Kaynak Modül" style={{ width: 170 }} allowClear />
          <Input value={ozelKod} onChange={(e) => setOzelKod(e.target.value)} placeholder="Özel Kod" style={{ width: 150 }} allowClear />
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>Yenile</Button>
          <Button icon={<PrinterOutlined />} onClick={() => setRaporModalAcik(true)}>Rapor</Button>
        </Space>
        <div className="!text-xs !text-gray-600 !flex !gap-4">
          <span>Madde: <b>{maddeler.length}</b></span>
          <span>Borç: <b>{fmtMoney(toplam.borc)}</b></span>
          <span>Alacak: <b>{fmtMoney(toplam.alacak)}</b></span>
        </div>
      </div>
      <div className="!flex-1 !min-h-0">
        <DataGrid<GridRow>
          rowData={rowData}
          columnDefs={columnDefs}
          getRowId={(p) => `${p.data.kind}-${p.data.fisId}-${p.data.maddeNo ?? ''}-${p.data.hesapKodu ?? ''}-${p.data.borc ?? ''}-${p.data.alacak ?? ''}-${p.data.headerText ?? ''}`}
          isFullWidthRow={(p: IsFullWidthRowParams<GridRow>) => p.rowNode.data?.kind === 'header'}
          fullWidthCellRenderer={(p: any) => (
            <div className="!px-2 !py-1 !font-semibold !bg-slate-100 !text-slate-700 !border-y !border-slate-200">
              {p.data?.headerText}
            </div>
          )}
          getRowStyle={(p) => p.data?.kind === 'footer' ? { fontWeight: 600, background: '#fafafa' } : undefined}
          pinnedBottomRowData={[{ kind: 'detail', hesapAdiAciklama: 'GENEL TOPLAM', borc: toplam.borc, alacak: toplam.alacak } as GridRow]}
          exportFileName="yevmiye-defteri"
        />
      </div>

      <Modal
        open={raporModalAcik}
        title={<span className="!text-[13px] !font-semibold">Rapor Seç</span>}
        onCancel={() => setRaporModalAcik(false)}
        footer={[
          <Button key="cancel" size="small" onClick={() => setRaporModalAcik(false)} className="!text-[12px]">
            Vazgeç
          </Button>,
          <Button
            key="preview"
            size="small"
            type="primary"
            icon={<EyeOutlined />}
            onClick={raporAc}
            loading={raporYukleniyor}
            disabled={!seciliTasarim}
            className="!text-[12px]"
          >
            Önizleme
          </Button>,
        ]}
        width={420}
        destroyOnHidden
      >
        <div className="!flex !flex-col !gap-2 !mt-2">
          <Typography.Text type="secondary" className="!text-[11px]">
            Açılacak raporu seçin. Önizleme ayrı pencerede açılır.
          </Typography.Text>
          <div className="!flex !items-center !gap-2">
            <span className="!text-[12px] !text-[#6b7280] !w-16 !shrink-0">Rapor</span>
            <Select
              size="small"
              value={seciliTasarim}
              onChange={setSeciliTasarim}
              className="!flex-1 !text-[12px]"
              options={yevmiyeDefteriTasarimlari.map((t) => ({ value: t.id, label: t.label }))}
            />
          </div>
          {yevmiyeDefteriTasarimlari.find((t) => t.id === seciliTasarim)?.aciklama && (
            <div className="!pl-[72px]">
              <Typography.Text type="secondary" className="!text-[10px]">
                {yevmiyeDefteriTasarimlari.find((t) => t.id === seciliTasarim)?.aciklama}
              </Typography.Text>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
