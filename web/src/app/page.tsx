'use client'

import { Card, Row, Col } from 'antd'

const stats = [
  { label: 'Toplam Kumaş (mt)', value: '12.580', color: '#f57c00' },
  { label: 'Bu Ay Giriş', value: '2.340', color: '#10b981' },
  { label: 'Bu Ay Çıkış', value: '1.850', color: '#ef4444' },
  { label: 'Aktif Depo', value: '4', color: '#3b82f6' },
]

export default function Home() {
  return (
    <div className="!p-3">
      <div className="!text-xs !font-semibold !text-[#6b7280] !uppercase !tracking-wider !mb-3">
        Dashboard
      </div>

      <Row gutter={[8, 8]}>
        {stats.map((s) => (
          <Col span={6} key={s.label}>
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
              <th className="!text-left !font-medium !pb-1">İşlem</th>
              <th className="!text-left !font-medium !pb-1">Ürün</th>
              <th className="!text-right !font-medium !pb-1">Miktar</th>
            </tr>
          </thead>
          <tbody>
            {[
              { tarih: '14.07', islem: 'Giriş', urun: 'Pamuk %100 S-205', miktar: '+500 mt', renk: '#10b981' },
              { tarih: '14.07', islem: 'Çıkış', urun: 'Pamuk %100 S-205', miktar: '-200 mt', renk: '#ef4444' },
              { tarih: '13.07', islem: 'Transfer', urun: 'Polyester P-112', miktar: 'Depo A→B', renk: '#3b82f6' },
              { tarih: '13.07', islem: 'Giriş', urun: 'Fermuar F-001', miktar: '+1.000 ad', renk: '#10b981' },
            ].map((row, i) => (
              <tr key={i} className="!border-b !border-gray-50">
                <td className="!py-1 !text-[#6b7280]">{row.tarih}</td>
                <td className="!py-1">
                  <span className="!text-[10px] !font-semibold !px-1.5 !py-0.5 !rounded" style={{ color: row.renk, backgroundColor: row.renk + '15' }}>
                    {row.islem}
                  </span>
                </td>
                <td className="!py-1 !text-[#374151]">{row.urun}</td>
                <td className="!py-1 !text-right !font-medium" style={{ color: row.renk }}>{row.miktar}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
