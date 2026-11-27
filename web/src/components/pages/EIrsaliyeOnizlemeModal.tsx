'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Modal, Button, Select, Alert, Spin, App, Tag, Dropdown } from 'antd'
import { PrinterOutlined, FilePdfOutlined, SendOutlined, CodeOutlined } from '@ant-design/icons'
import { toCanvas } from '@bwip-js/browser'
import { eIrsaliyeApi, type EIrsaliyePayload } from '@/lib/e-irsaliye-api'
import { hataMetni } from '@/lib/hata'

interface EIrsaliyeOnizlemeModalProps {
  open: boolean
  fisId: number | null
  /** true: fişin e-İrsaliyesi yoksa açar açmaz oluşturur (context menü "Oluştur"). */
  otomatikOlustur?: boolean
  /** true: mevcut e-İrsaliye yerine güncel fişten yeniden oluşturur. */
  yenidenOlustur?: boolean
  onClose: () => void
  onChanged?: () => void
}

/**
 * Chrome 158 (17 Kasım 2026) tarayıcıdan XSLTProcessor'ı kaldırdı. Yerel motor
 * yoksa aynı API'yi sunan JS motoru (@tradik/xslt-processor) yüklenir.
 */
type XsltMotoru = {
  importStylesheet: (style: Node) => void
  transformToFragment: (source: Node, output: Document) => DocumentFragment | null
}

async function xsltMotoru(): Promise<new () => XsltMotoru> {
  if (typeof XSLTProcessor !== 'undefined') return XSLTProcessor as unknown as new () => XsltMotoru
  const mod = await import('@tradik/xslt-processor')
  return mod.XSLTProcessor as unknown as new () => XsltMotoru
}

/** iframe belgesi ilk karede hazır olmayabilir; kısa süre bekler. */
async function iframeBelgesi(iframe: HTMLIFrameElement | null, timeoutMs = 2000): Promise<Document | null> {
  if (!iframe) return null
  const bitis = performance.now() + timeoutMs
  for (;;) {
    const doc = iframe.contentDocument
    if (doc) return doc
    if (performance.now() > bitis) return null
    await new Promise((r) => setTimeout(r, 30))
  }
}

const durumRengi = (durum: string | null) => {
  if (durum === 'Dosya Gönderildi') return 'green'
  if (durum === 'İptal') return 'red'
  if (durum === 'Dosya Oluşturuldu') return 'blue'
  return 'default'
}

export default function EIrsaliyeOnizlemeModal({
  open,
  fisId,
  otomatikOlustur,
  yenidenOlustur,
  onClose,
  onChanged,
}: EIrsaliyeOnizlemeModalProps) {
  const { message } = App.useApp()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [payload, setPayload] = useState<EIrsaliyePayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [renderHata, setRenderHata] = useState<string | null>(null)
  const [xslt, setXslt] = useState<string>('')
  const [sending, setSending] = useState(false)

  // Açılışta fişin e-İrsaliye durumu okunur; yoksa ve istenmişse oluşturulur.
  useEffect(() => {
    if (!open || fisId == null) return
    let active = true
    setLoading(true)
    setPayload(null)
    setHata(null)
    setRenderHata(null)
    ;(async () => {
      try {
        let p = await eIrsaliyeApi.get(fisId)
        if (otomatikOlustur && (yenidenOlustur || !p.eIrsaliye.eIrsaliyeNo)) {
          p = await eIrsaliyeApi.olustur(fisId, yenidenOlustur ? { yenile: true } : undefined)
          onChanged?.()
        }
        if (!active) return
        setPayload(p)
        setXslt(p.eIrsaliye.xsltDosyaAdi || p.varsayilanXslt || 'Default.xslt')
      } catch (e) {
        if (active) setHata(hataMetni(e, 'e-İrsaliye yüklenemedi'))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fisId, otomatikOlustur, yenidenOlustur])

  // Saklanan XML, seçili XSLT ile tarayıcıda HTML'e dönüştürülür (XSLT 1.0).
  useEffect(() => {
    const xml = payload?.eIrsaliye.xml
    if (!open || !xml || !xslt || loading) return
    let active = true
    setRenderHata(null)
    let asama = 'tasarım dosyası okunamadı'
    ;(async () => {
      try {
        const res = await fetch(`/xslt/${encodeURI(xslt)}`, { cache: 'no-store' })
        if (!res.ok) throw new Error(`/xslt/${xslt} bulunamadı (HTTP ${res.status})`)
        const xsltText = await res.text()
        if (!active) return

        asama = 'e-İrsaliye XML ayrıştırılamadı'
        const xmlDoc = new DOMParser().parseFromString(xml, 'application/xml')
        if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
          throw new Error('e-İrsaliye XML ayrıştırılamadı')
        }
        asama = `tasarım dosyası ayrıştırılamadı (${xslt})`
        const xsltDoc = new DOMParser().parseFromString(xsltText, 'application/xml')
        if (xsltDoc.getElementsByTagName('parsererror').length > 0) {
          throw new Error('XSLT dosyası ayrıştırılamadı')
        }

        asama = `tasarım motoru yüklenemedi (${xslt})`
        const Motor = await xsltMotoru()
        if (!active) return
        asama = `tasarım uygulanamadı (${xslt})`
        const processor = new Motor()
        processor.importStylesheet(xsltDoc)
        const doc = await iframeBelgesi(iframeRef.current)
        if (!active) return
        if (!doc) throw new Error('Önizleme alanı hazır değil')

        doc.open()
        doc.write(
          '<!doctype html><html><head><meta charset="utf-8"><style>' +
            '@page{size:A4;margin:10mm}' +
            'html,body{margin:0;padding:0;background:#fff}' +
            'body{font-family:Arial,Helvetica,sans-serif;color:#000}' +
            'img{max-width:100%}' +
            '</style></head><body></body></html>',
        )
        doc.close()
        const frag = processor.transformToFragment(xmlDoc, doc)
        if (!frag) throw new Error('dönüşüm sonucu boş')
        const govde = doc.body ?? doc.documentElement
        if (!govde) throw new Error('Önizleme gövdesi oluşturulamadı')
        govde.replaceChildren(doc.importNode(frag, true))

        // XSLT karekodu <canvas data-qr="..."/> olarak bırakır; QR burada çizilir.
        for (const el of Array.from(doc.querySelectorAll('canvas[data-qr]'))) {
          const veri = el.getAttribute('data-qr')
          if (!veri) continue
          try {
            toCanvas(el as HTMLCanvasElement, { bcid: 'qrcode', text: veri, scale: 3, eclevel: 'M' })
          } catch {
            // karekod üretilemediyse önizleme devam eder
          }
        }
      } catch (e) {
        if (active) setRenderHata(`${asama}: ${hataMetni(e, 'bilinmeyen hata')}`)
      }
    })()
    return () => {
      active = false
    }
  }, [open, payload?.eIrsaliye.xml, xslt, loading])

  const tasarimOptions = useMemo(() => {
    const opts = (payload?.tasarimlar ?? []).map((t) => ({
      value: t.xsltDosyaAdi,
      label: `${t.ad} (${t.xsltDosyaAdi})${t.varsayilan ? ' • varsayılan' : ''}`,
    }))
    if (xslt && !opts.some((o) => o.value === xslt)) opts.unshift({ value: xslt, label: xslt })
    return opts
  }, [payload, xslt])

  const tasarimDegistir = async (v: string) => {
    setXslt(v)
    if (fisId == null) return
    try {
      const p = await eIrsaliyeApi.tasarimSec(fisId, v)
      setPayload(p)
    } catch (e) {
      message.error(hataMetni(e))
    }
  }

  const hazir = Boolean(payload?.eIrsaliye.eIrsaliyeNo) && !renderHata
  const gonderildi = payload?.eIrsaliye.durum === 'Dosya Gönderildi'
  const xmlVar = Boolean(payload?.eIrsaliye.xml)

  // XML, harici XSLT editörlerinde tasarım denemek için kopyalanabilir/indirilebilir.
  const xmlKopyala = async () => {
    const xml = payload?.eIrsaliye.xml
    if (!xml) return
    try {
      await navigator.clipboard.writeText(xml)
      message.success('XML panoya kopyalandı')
    } catch {
      message.error('XML panoya kopyalanamadı')
    }
  }

  const xmlIndir = () => {
    const xml = payload?.eIrsaliye.xml
    if (!xml) return
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${payload?.eIrsaliye.eIrsaliyeNo || 'e-irsaliye'}.xml`
    a.click()
    URL.revokeObjectURL(url)
  }

  const xmlMenuItems = [
    { key: 'kopyala', label: 'Panoya Kopyala', disabled: !xmlVar, onClick: xmlKopyala },
    { key: 'indir', label: 'XML İndir', disabled: !xmlVar, onClick: xmlIndir },
  ]

  const yazdir = (pdf: boolean) => {
    const win = iframeRef.current?.contentWindow
    if (!win) return
    if (pdf) message.info('Yazdırma penceresinde hedef olarak "PDF olarak kaydet"i seçin')
    win.focus()
    win.print()
  }

  const gonder = async () => {
    if (fisId == null) return
    setSending(true)
    try {
      const p = await eIrsaliyeApi.gonder(fisId)
      setPayload(p)
      message.success('e-İrsaliye gönderildi (simülasyon)')
      onChanged?.()
    } catch (e) {
      message.error(hataMetni(e))
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="e-İrsaliye Önizleme"
      width="82%"
      style={{ top: 24 }}
      destroyOnHidden
      styles={{ body: { padding: 0 } }}
      afterClose={() => {
        setPayload(null)
        setHata(null)
        setRenderHata(null)
        setXslt('')
      }}
      footer={[
        <Button key="yazdir" icon={<PrinterOutlined />} disabled={!hazir} onClick={() => yazdir(false)}>
          Yazdır
        </Button>,
        <Button key="pdf" icon={<FilePdfOutlined />} disabled={!hazir} onClick={() => yazdir(true)}>
          PDF olarak kaydet
        </Button>,
        <Button
          key="gonder"
          type="primary"
          icon={<SendOutlined />}
          disabled={!hazir || gonderildi}
          loading={sending}
          onClick={gonder}
        >
          Gönder
        </Button>,
        <Button key="iptal" onClick={onClose}>
          İptal
        </Button>,
      ]}
    >
      <div className="!flex !flex-col" style={{ height: '72vh' }}>
        <div className="!border-b !border-gray-200 !bg-[#fafafa] !px-3 !py-2 !flex !flex-wrap !gap-x-5 !gap-y-1 !items-center !flex-shrink-0">
          <div className="!flex !items-center !gap-1.5">
            <span className="!text-[10px] !text-[#9ca3af] !uppercase">Fiş</span>
            <span className="!text-[11px] !font-semibold">{payload?.fis.fisNo || '-'}</span>
          </div>
          <div className="!flex !items-center !gap-1.5">
            <span className="!text-[10px] !text-[#9ca3af] !uppercase">Cari</span>
            <span className="!text-[11px] !font-semibold">{payload?.fis.cariAd || '-'}</span>
          </div>
          <div className="!flex !items-center !gap-1.5">
            <span className="!text-[10px] !text-[#9ca3af] !uppercase">e-İrsaliye No</span>
            <span className="!text-[11px] !font-semibold !text-[#f57c00]">{payload?.eIrsaliye.eIrsaliyeNo || '-'}</span>
          </div>
          <div className="!flex !items-center !gap-1.5">
            <span className="!text-[10px] !text-[#9ca3af] !uppercase">Durum</span>
            {payload?.eIrsaliye.durum ? (
              <Tag color={durumRengi(payload.eIrsaliye.durum)} className="!text-[10px] !m-0">
                {payload.eIrsaliye.durum}
              </Tag>
            ) : (
              <span className="!text-[11px]">-</span>
            )}
          </div>
          <div className="!ml-auto !flex !items-center !gap-2">
            <span className="!text-[10px] !text-[#9ca3af] !uppercase">Tasarım</span>
            <Select
              size="small"
              value={xslt || undefined}
              onChange={tasarimDegistir}
              options={tasarimOptions}
              placeholder="XSLT seçin"
              style={{ minWidth: 240 }}
              className="!text-[11px]"
            />
            <Dropdown menu={{ items: xmlMenuItems }} trigger={['click']}>
              <Button size="small" icon={<CodeOutlined />} disabled={!xmlVar}>
                XML
              </Button>
            </Dropdown>
          </div>
        </div>

        {hata ? (
          <div className="!p-4">
            <Alert type="error" showIcon title="e-İrsaliye oluşturulamadı" description={hata} />
          </div>
        ) : loading ? (
          <div className="!flex-1 !flex !items-center !justify-center">
            <Spin />
          </div>
        ) : renderHata ? (
          <div className="!p-4">
            <Alert type="warning" showIcon title="Tasarım uygulanamadı" description={renderHata} />
          </div>
        ) : (
          <iframe ref={iframeRef} title="e-İrsaliye" className="!flex-1 !w-full !border-0" />
        )}
      </div>
    </Modal>
  )
}
