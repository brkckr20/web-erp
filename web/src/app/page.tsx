'use client'

import { Card, Row, Col } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { depoApi } from '@/lib/depo-api'
import { dovizApi, type DovizKuruSatir } from '@/lib/doviz-api'
import { irsaliyeApi, type Irsaliye } from '@/lib/irsaliye-api'

interface SonHareket {
  key: string
  tarih: string | null
  fisNo: string
  fisTipi: string
  kaynak: 'İrsaliye' | 'Stok'
  cari: string
  kg: number
  mt: number
  adet: number
  tutar: number
}

// Tüm fişler (irsaliye + malzeme yönetim fişleri) irsaliye tablosuna yazılır.
// Backend'de /stok-hareket-fisi endpoint'i yok, o yüzden tek kaynak GET /irsaliye'dir.
const IRS_GIRIS = new Set(['1', '2', '3', '4', '5', '9', '11', '12', '10', '16', '17', '18', '40', '101', '20'])
const IRS_CIKIS = new Set(['8', '120', '121', '123', '134', '122', '124', '130', '131', '132', '135', '136', '137', '140', '99'])

const ayniAy = (d: string | null, now: Date) => {
  if (!d) return false
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return false
  return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth()
}

const formatTarihKisa = (d: string | null) => {
  if (!d) return '-'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '-'
  return dt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
}

export default function Home() {
  const [aktifDepo, setAktifDepo] = useState<number | null>(null)
  const [sonHareketler, setSonHareketler] = useState<SonHareket[]>([])
  const [hareketYukleniyor, setHareketYukleniyor] = useState(true)
  const [buAyGiris, setBuAyGiris] = useState<number | null>(null)
  const [buAyCikis, setBuAyCikis] = useState<number | null>(null)
  const [kurlar, setKurlar] = useState<DovizKuruSatir[]>([])

  useEffect(() => {
    depoApi
      .list()
      .then((depolar) => setAktifDepo(depolar.filter((d) => d.durum).length))
      .catch(() => setAktifDepo(null))
    dovizApi.getSonKurlar().then(setKurlar).catch(() => setKurlar([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    setHareketYukleniyor(true)
    Promise.allSettled([irsaliyeApi.list()])
      .then(([irsaliyeRes]) => {
        if (cancelled) return
        const rows: SonHareket[] = []
        if (irsaliyeRes.status === 'fulfilled') {
          for (const i of irsaliyeRes.value as Irsaliye[]) {
            const kalemler = i.kalemler ?? []
            rows.push({
              key: `irsaliye-${i.id}`,
              tarih: i.irsaliyeTarihi,
              fisNo: i.irsaliyeNo,
              fisTipi: i.irsaliyeTipi,
              kaynak: 'İrsaliye',
              cari: i.cariHesap?.ad ?? i.cariHesap?.kod ?? '',
              kg: kalemler.reduce((a, k) => a + (Number(k.netAgirlik) || 0), 0),
              mt: kalemler.reduce((a, k) => a + (Number(k.netMetre) || 0), 0),
              adet: kalemler.reduce((a, k) => a + (Number(k.adet) || 0), 0),
              tutar: kalemler.reduce((a, k) => a + (Number(k.satirTutari) || 0), 0),
            })
          }
        }
        rows.sort((a, b) => {
          const ta = a.tarih ? new Date(a.tarih).getTime() : 0
          const tb = b.tarih ? new Date(b.tarih).getTime() : 0
          return tb - ta
        })
        setSonHareketler(rows.slice(0, 10))
        const now = new Date()
        let giris = 0
        let cikis = 0
        if (irsaliyeRes.status === 'fulfilled') {
          for (const i of irsaliyeRes.value as Irsaliye[]) {
            if (!ayniAy(i.irsaliyeTarihi, now)) continue
            const tip = String(i.irsaliyeTipi)
            if (IRS_GIRIS.has(tip)) giris++
            else if (IRS_CIKIS.has(tip)) cikis++
          }
        }
        setBuAyGiris(giris)
        setBuAyCikis(cikis)
      })
      .finally(() => { if (!cancelled) setHareketYukleniyor(false) })
    return () => { cancelled = true }
  }, [])

  const formatKur = (v: number | null) =>
    v == null ? '—' : v.toLocaleString('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })

  const stats = useMemo(() => {
    const usd = kurlar.find((k) => k.dovizKodu === 'USD')
    const eur = kurlar.find((k) => k.dovizKodu === 'EUR')
    return [
      { label: 'Bu Ay Giriş', value: buAyGiris === null ? '—' : String(buAyGiris), color: '#10b981' },
      { label: 'Bu Ay Çıkış', value: buAyCikis === null ? '—' : String(buAyCikis), color: '#ef4444' },
      { label: 'Aktif Depo', value: aktifDepo === null ? '—' : String(aktifDepo), color: '#3b82f6' },
      {
        label: `USD${usd?.tarih ? ' · ' + formatTarihKisa(usd.tarih) : ''}`,
        value: formatKur(usd?.satisKuru ?? null),
        sub: usd ? `Alış ${formatKur(usd.alisKuru)}` : undefined,
        color: '#8b5cf6',
      },
      {
        label: `EUR${eur?.tarih ? ' · ' + formatTarihKisa(eur.tarih) : ''}`,
        value: formatKur(eur?.satisKuru ?? null),
        sub: eur ? `Alış ${formatKur(eur.alisKuru)}` : undefined,
        color: '#f59e0b',
      },
    ]
  }, [aktifDepo, buAyGiris, buAyCikis, kurlar])

  return (
    <div className="!p-3">
      <div className="!text-xs !font-semibold !text-[#6b7280] !uppercase !tracking-wider !mb-3">
        Dashboard
      </div>

      <Row gutter={[8, 8]}>
        {stats.map((s) => (
          <Col flex="1 1 0" key={s.label}>
            <Card
              className="!rounded-sm !shadow-none"
              styles={{ body: { padding: '10px 12px' } }}
            >
              <div className="!text-[10px] !text-[#9ca3af] !uppercase !tracking-wide !mb-1">
                {s.label}
              </div>
              <div className="!text-xl !font-bold" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="!text-[10px] !text-[#9ca3af] !mt-0.5">{'sub' in s ? (s.sub ?? ' ') : ' '}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        className="!mt-3 !rounded-sm !shadow-none"
        styles={{ body: { padding: '10px 12px' } }}
      >
        <div className="!text-[11px] !text-[#9ca3af]">
          Sol menüden bir modül seçerek başlayın.
        </div>
      </Card>

      <Card
        className="!mt-3 !rounded-sm !shadow-none"
        styles={{ body: { padding: '10px 12px' } }}
      >
        <div className="!text-[10px] !font-semibold !text-[#6b7280] !uppercase !tracking-wider !mb-2">
          Son Hareketler
        </div>
        <table className="!w-full !text-[11px]">
          <thead>
            <tr className="!text-[#9ca3af] !border-b !border-gray-100">
              <th className="!text-left !font-medium !pb-1">Tarih</th>
              <th className="!text-left !font-medium !pb-1">Fiş No</th>
              <th className="!text-left !font-medium !pb-1">Fiş Tipi</th>
              <th className="!text-left !font-medium !pb-1">Cari</th>
              <th className="!text-right !font-medium !pb-1">Kg</th>
              <th className="!text-right !font-medium !pb-1">Mt</th>
              <th className="!text-right !font-medium !pb-1">Adet</th>
              <th className="!text-right !font-medium !pb-1">Tutar</th>
            </tr>
          </thead>
          <tbody>
            {hareketYukleniyor ? (
              <tr><td colSpan={8} className="!py-2 !text-center !text-[#9ca3af]">Yükleniyor...</td></tr>
            ) : sonHareketler.length === 0 ? (
              <tr><td colSpan={8} className="!py-2 !text-center !text-[#9ca3af]">Hareket bulunamadı</td></tr>
            ) : sonHareketler.map((row) => {
              const renk = row.kaynak === 'İrsaliye' ? '#10b981' : '#3b82f6'
              return (
              <tr key={row.key} className="!border-b !border-gray-50">
                <td className="!py-1 !text-[#6b7280]">{formatTarihKisa(row.tarih)}</td>
                <td className="!py-1 !font-medium !text-[#374151]">{row.fisNo}</td>
                <td className="!py-1">
                  <span className="!text-[10px] !font-semibold !px-1.5 !py-0.5 !rounded" style={{ color: renk, backgroundColor: renk + '15' }}>
                    {row.kaynak} {row.fisTipi}
                  </span>
                </td>
                <td className="!py-1 !text-[#374151]">{row.cari || '-'}</td>
                <td className="!py-1 !text-right">{row.kg ? row.kg.toFixed(2) : '-'}</td>
                <td className="!py-1 !text-right">{row.mt ? row.mt.toFixed(2) : '-'}</td>
                <td className="!py-1 !text-right">{row.adet ? String(row.adet) : '-'}</td>
                <td className="!py-1 !text-right !font-medium">{row.tutar ? row.tutar.toFixed(2) : '-'}</td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
