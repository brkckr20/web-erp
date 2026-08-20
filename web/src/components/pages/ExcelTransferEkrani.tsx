'use client'

import { useState } from 'react'
import { Upload, Switch, InputNumber, Alert, App } from 'antd'
import type { UploadFile } from 'antd'
import { DownloadOutlined, SaveOutlined, InboxOutlined } from '@ant-design/icons'
import type { Cell } from 'exceljs'
import CardToolbar from '@/components/shared/CardToolbar'
import type { TransferSatir, TransferSonuc } from '@/lib/transfer-types'

export interface TransferAlan {
  anahtar: keyof TransferSatir & string
  etiket: string
  zorunlu?: boolean
}

interface ExcelTransferEkraniProps {
  alanlar: TransferAlan[]
  sablonSira: readonly (keyof TransferSatir & string)[]
  sablonBasliklar: Record<string, string>
  sablonOrnek: unknown[]
  sablonDosyaAdi: string
  importFonksiyon: (satirlar: TransferSatir[]) => Promise<TransferSonuc>
}

function hucreDeger(hucre: Cell): unknown {
  const v = hucre.value
  if (v == null) return null
  if (v instanceof Date) return v
  if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') return v
  if (typeof v === 'object') {
    if ('result' in v && v.result != null) return v.result
    if ('text' in v) return v.text
  }
  return hucre.text
}

export default function ExcelTransferEkrani({
  alanlar,
  sablonSira,
  sablonBasliklar,
  sablonOrnek,
  sablonDosyaAdi,
  importFonksiyon,
}: ExcelTransferEkraniProps) {
  const { message } = App.useApp()

  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [dosya, setDosya] = useState<File | null>(null)
  const [ilkSatirBaslik, setIlkSatirBaslik] = useState(true)
  const [kolonMap, setKolonMap] = useState<Partial<Record<string, number>>>({})
  const [kaydediyor, setKaydediyor] = useState(false)
  const [sablonIndiriliyor, setSablonIndiriliyor] = useState(false)
  const [sonuc, setSonuc] = useState<TransferSonuc | null>(null)

  const kolonNo = (anahtar: string) => kolonMap[anahtar] ?? 0

  const handleKolon = (anahtar: string, deger: number | null) => {
    setSonuc(null)
    setKolonMap((m) => ({ ...m, [anahtar]: deger ?? undefined }))
  }

  const handleSablonIndir = async () => {
    setSablonIndiriliyor(true)
    try {
      const ExcelJS = (await import('exceljs')).default
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet('Veri')
      ws.columns = sablonSira.map((a) => ({
        header: sablonBasliklar[a],
        key: a,
        width: Math.max(12, (sablonBasliklar[a] ?? a).length + 6),
      }))
      const headerRow = ws.getRow(1)
      headerRow.font = { bold: true, size: 11 }
      ws.addRow(sablonOrnek)

      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = sablonDosyaAdi
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      const otomatik = Object.fromEntries(sablonSira.map((a, i) => [a, i + 1]))
      setKolonMap({ ...(otomatik as Partial<Record<string, number>>) })
      setIlkSatirBaslik(true)
      message.success('Örnek şablon indirildi, sütun numaraları otomatik dolduruldu')
    } catch {
      message.error('Şablon oluşturulamadı')
    } finally {
      setSablonIndiriliyor(false)
    }
  }

  const parseDosya = async (f: File): Promise<TransferSatir[]> => {
    const ExcelJS = (await import('exceljs')).default
    const buffer = await f.arrayBuffer()
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buffer)
    const ws = wb.worksheets[0]
    if (!ws) return []

    const startRow = ilkSatirBaslik ? 2 : 1
    const satirlar: TransferSatir[] = []

    ws.eachRow((row, rowNum) => {
      if (rowNum < startRow) return
      const satir: TransferSatir = {}
      let bos = true
      for (const alan of alanlar) {
        const col = kolonMap[alan.anahtar]
        if (!col) continue
        let deger = hucreDeger(row.getCell(col))
        if (deger instanceof Date) deger = deger.toISOString()
        if (deger == null) continue
        if (typeof deger === 'string' && deger.trim() === '') continue
        satir[alan.anahtar] =
          typeof deger === 'number' || typeof deger === 'boolean' ? deger : String(deger).trim()
        bos = false
      }
      if (!bos) satirlar.push(satir)
    })
    return satirlar
  }

  const handleKaydet = async () => {
    if (!dosya) {
      message.warning('Önce excel dosyası seçin')
      return
    }
    const zorunlular = alanlar.filter((a) => a.zorunlu)
    const eksik = zorunlular.filter((a) => !kolonMap[a.anahtar])
    if (eksik.length > 0) {
      message.warning(`${eksik.map((a) => a.etiket).join(', ')} için sütun numarası girmelisiniz`)
      return
    }
    setKaydediyor(true)
    try {
      const satirlar = await parseDosya(dosya)
      if (satirlar.length === 0) {
        message.warning('Belirtilen aralıkta veri satırı bulunamadı')
        return
      }
      const sonucSonuc = await importFonksiyon(satirlar)
      setSonuc(sonucSonuc)
      if (sonucSonuc.eklenen > 0) message.success(`${sonucSonuc.eklenen} kayıt eklendi`)
      else message.warning('Eklenecek yeni kayıt bulunamadı')
    } catch {
      message.error('Transfer sırasında hata oluştu')
    } finally {
      setKaydediyor(false)
    }
  }

  const toolbarButtons = [
    {
      key: 'sablon',
      label: 'Örnek Şablon İndir',
      icon: <DownloadOutlined />,
      onClick: handleSablonIndir,
      disabled: sablonIndiriliyor,
    },
    {
      key: 'save',
      label: 'Kaydet',
      type: 'primary' as const,
      icon: <SaveOutlined />,
      onClick: handleKaydet,
      disabled: kaydediyor,
    },
  ]

  const alertTip = sonuc ? (sonuc.atlanan.length === 0 ? 'success' : 'warning') : undefined

  return (
    <div className="!h-full !flex !flex-col">
      <CardToolbar buttons={toolbarButtons} />
      <div className="!bg-white !border !border-gray-200 !rounded-sm !flex-1 !flex !flex-col !overflow-hidden">
        <div className="!flex-1 !min-h-0 !overflow-auto !p-4 !space-y-4">
          <div className="!border !border-gray-200 !rounded-sm !p-3">
            <div className="!text-[11px] !font-semibold !uppercase !text-gray-700 !mb-2">Excel Dosyası</div>
            <Upload.Dragger
              accept=".xlsx"
              maxCount={1}
              fileList={fileList}
              beforeUpload={(file) => {
                setDosya(file as File)
                setSonuc(null)
                return false
              }}
              onChange={({ fileList: fl }) => {
                setFileList(fl.slice(-1))
                if (fl.length === 0) {
                  setDosya(null)
                  setSonuc(null)
                }
              }}
              onRemove={() => {
                setDosya(null)
                setSonuc(null)
                return true
              }}
            >
              <p className="!ant-upload-drag-icon !mb-1">
                <InboxOutlined />
              </p>
              <p className="!text-[12px] !m-0">.xlsx dosyasını sürükleyin veya tıklayarak seçin</p>
            </Upload.Dragger>
          </div>

          <div className="!border !border-gray-200 !rounded-sm !p-3">
            <div className="!text-[11px] !font-semibold !uppercase !text-gray-700 !mb-2">Ayarlar</div>
            <div className="!flex !items-center !gap-2 !mb-1">
              <Switch size="small" checked={ilkSatirBaslik} onChange={setIlkSatirBaslik} />
              <label className="!text-[12px]">İlk satır başlık satırı</label>
            </div>
            <div className="!text-[11px] !text-gray-500">
              Açıksa veri 2. satırdan, kapalıysa 1. satırdan itibaren okunur.
            </div>
          </div>

          <div className="!border !border-gray-200 !rounded-sm !p-3">
            <div className="!text-[11px] !font-semibold !uppercase !text-gray-700 !mb-1">Kolon Eşleme</div>
            <div className="!text-[11px] !text-gray-500 !mb-3">
              Her alan için excel&apos;deki sütun numarasını yazın (1&apos;den başlar). Boş bırakılan
              alanlar atlanır.
            </div>
            <div className="!grid !grid-cols-1 !gap-1.5 !max-h-[340px] !overflow-auto">
              {alanlar.map((alan) => (
                <div key={alan.anahtar} className="!flex !items-center !gap-2">
                  <label className="!text-[12px] !w-28 !shrink-0 !text-right">
                    {alan.etiket}
                    {alan.zorunlu && <span className="!text-red-500"> *</span>}
                  </label>
                  <InputNumber
                    size="small"
                    min={0}
                    max={200}
                    value={kolonNo(alan.anahtar)}
                    onChange={(v) => handleKolon(alan.anahtar, v)}
                    className="!w-24"
                    placeholder="0"
                  />
                  <span className="!text-[11px] !text-gray-500">sütun</span>
                </div>
              ))}
            </div>
          </div>

          {sonuc && (
            <Alert
              type={alertTip}
              showIcon
              title={`Sonuç: ${sonuc.eklenen} eklendi, ${sonuc.atlanan.length} atlandı (Toplam ${sonuc.toplam} satır)`}
              description={
                sonuc.atlanan.length > 0 ? (
                  <div className="!max-h-[180px] !overflow-auto">
                    <table className="!text-[11px] !w-full">
                      <thead>
                        <tr className="!text-left !text-gray-500">
                          <th className="!pr-3 !py-0.5">Kod</th>
                          <th>Neden</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sonuc.atlanan.map((a, i) => (
                          <tr key={i}>
                            <td className="!pr-3 !py-0.5 !font-mono">{a.kod}</td>
                            <td>{a.neden}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : undefined
              }
            />
          )}
        </div>
      </div>
    </div>
  )
}