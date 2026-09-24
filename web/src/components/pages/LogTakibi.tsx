import { useEffect, useState } from 'react'
import { Table, Select, Button, DatePicker } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { auditApi, type AuditLog } from '@/lib/audit-api'

const TABLOLAR = ['Siparis', 'Irsaliye', 'CariHesap', 'IsEmri', 'StokHareketFisi', 'HizmetTalep', 'Kullanici']

export default function LogTakibi() {
  const [list, setList] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [tablo, setTablo] = useState<string>()
  const [baslangic, setBaslangic] = useState<Dayjs>(() => dayjs().startOf('day'))
  const [bitis, setBitis] = useState<Dayjs>(() => dayjs().endOf('day'))
  const [loading, setLoading] = useState(false)

  const yukle = async () => {
    setLoading(true)
    try {
      const res = await auditApi.list({
        tablo,
        take: 500,
        from: baslangic ? baslangic.toISOString() : undefined,
        to: bitis ? bitis.toISOString() : undefined,
      })
      setList(res.data)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    yukle()
  }, [tablo])

  return (
    <div className="!p-3 !h-full !flex !flex-col">
      <div className="!flex !items-center !justify-between !mb-3 !flex-shrink-0">
        <div className="!text-[10px] !font-semibold !text-[#9ca3af] !uppercase !tracking-wider">
          Log Takibi (Toplam: {total})
        </div>
        <div className="!flex !items-center !gap-1.5">
          <DatePicker
            size="small"
            placeholder="Başlangıç"
            value={baslangic}
            onChange={(v) => v && setBaslangic(v)}
            format="DD.MM.YYYY"
            className="!w-[130px]"
          />
          <DatePicker
            size="small"
            placeholder="Bitiş"
            value={bitis}
            onChange={(v) => v && setBitis(v)}
            format="DD.MM.YYYY"
            className="!w-[130px]"
          />
          <Select
            placeholder="Modül filtrele"
            allowClear
            size="small"
            style={{ width: 160 }}
            value={tablo}
            onChange={setTablo}
            options={TABLOLAR.map((t) => ({ value: t, label: t }))}
          />
          <Button size="small" icon={<ReloadOutlined />} onClick={yukle} className="!text-[11px] !h-7" />
        </div>
      </div>
      <div className="!bg-white !rounded-sm !flex-1 !min-h-0">
      <Table
        rowKey="id"
        loading={loading}
        dataSource={list}
        pagination={false}
        size="small"
        expandable={{
          expandedRowRender: (r) => {
            // GÜNCELLEDİ: "alan: eski → yeni" listesi
            let farklar: string[] = []
            try {
              const parsed = r.degisenAlanlar ? JSON.parse(r.degisenAlanlar) : []
              if (Array.isArray(parsed)) farklar = parsed
            } catch (e) {
              farklar = []
            }
            // OLUSTURULDU: ilk değerleri yeniVeri'den çıkar
            let ilkDegerler: Array<[string, string]> = []
            if (r.islem === 'OLUSTURDU' && r.yeniVeri) {
              try {
                const obj = JSON.parse(r.yeniVeri)
                const skip = new Set(['id', 'createdAt', 'updatedAt', 'created_at', 'updated_at'])
                ilkDegerler = Object.entries(obj)
                  .filter(([k, v]) => !skip.has(k) && v != null && String(v) !== '')
                  .map(([k, v]) => [k, String(v).slice(0, 80)])
              } catch (e) {
                ilkDegerler = []
              }
            }
            if (r.islem === 'OLUSTURDU') {
              return (
                <div>
                  {ilkDegerler.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {ilkDegerler.map(([k, v], i) => (
                        <li key={i}>
                          <b>{k}:</b> {v}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span style={{ color: '#999' }}>İlk değer detayı yok</span>
                  )}
                </div>
              )
            }
            return (
              <div>
                {farklar.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {farklar.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                ) : (
                  <span style={{ color: '#999' }}>Alan detayı yok</span>
                )}
              </div>
            )
          },
        }}
        columns={[
          { title: 'Tarih', dataIndex: 'tarih', render: (v: string) => new Date(v).toLocaleString('tr-TR') },
          { title: 'Kullanıcı', dataIndex: 'kullaniciAd' },
          { title: 'İşlem', dataIndex: 'islem' },
          { title: 'Modül', dataIndex: 'tablo' },
          { title: 'Kayıt', dataIndex: 'kayitNo' },
          { title: 'Özet', dataIndex: 'ozet', ellipsis: true },
          { title: 'IP', dataIndex: 'ip' },
        ]}
      />
      </div>
    </div>
  )
}
