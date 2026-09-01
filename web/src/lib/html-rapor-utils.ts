import html2canvas from 'html2canvas'
import { PDFDocument } from 'pdf-lib'

function formatDateTR(date: Date): string {
  const gun = String(date.getDate()).padStart(2, '0')
  const ay = String(date.getMonth() + 1).padStart(2, '0')
  const yil = date.getFullYear()
  return `${gun}.${ay}.${yil}`
}

function formatNumberTR(value: unknown, decimals = 2): string {
  if (value === null || value === undefined) return ''
  const num = typeof value === 'string' ? parseFloat(value) : Number(value)
  if (isNaN(num)) return String(value)
  return num.toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function formatDate(value: unknown): string {
  if (!value) return ''
  const d = new Date(value as string | number)
  if (isNaN(d.getTime())) return String(value)
  return formatDateTR(d)
}

function replacePlaceholders(html: string, data: Record<string, unknown>): string {
  let result = html
  for (const [key, value] of Object.entries(data)) {
    if (key === 'kalemler') continue
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    let display = ''
    if (value === null || value === undefined) {
      display = ''
    } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      display = formatDate(value)
    } else if (typeof value === 'number') {
      display = formatNumberTR(value)
    } else {
      display = String(value)
    }
    result = result.replace(regex, display)
  }
  return result
}

function buildKalemRows(kalemler: Record<string, unknown>[]): string {
  return kalemler
    .map(
      (k) => `<tr>
        <td>${k.malzemeKod ?? ''}</td>
        <td>${k.malzemeAd ?? ''}</td>
        <td class="right">${formatNumberTR(k.miktar)}</td>
        <td>${k.aciklama ?? ''}</td>
      </tr>`,
    )
    .join('')
}

async function renderToCanvas(
  htmlTemplate: string,
  headerData: Record<string, unknown>,
  kalemData: Record<string, unknown>[],
  logo?: string,
): Promise<HTMLCanvasElement> {
  let html = htmlTemplate
  const logoSrc = logo || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  html = replacePlaceholders(html, { ...headerData, logo: logoSrc, bugun: formatDateTR(new Date()) })
  html = html.replace(/\{\{kalemler\}\}/g, buildKalemRows(kalemData))

  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-9999px'
  container.style.top = '0'
  container.style.background = '#fff'
  container.innerHTML = html
  document.body.appendChild(container)

  try {
    const pageEl = container.querySelector('.page') as HTMLElement | null
    const target = pageEl || container

    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    })
    return canvas
  } finally {
    document.body.removeChild(container)
  }
}

async function canvasToPdfBlob(
  canvas: HTMLCanvasElement,
  boyut: 'A5' | 'A4',
  yon: 'yatay' | 'dikey',
): Promise<Blob> {
  const pdfW = boyut === 'A4' ? 297 : 210
  const pdfH = boyut === 'A4' ? 210 : 148
  const pageW = yon === 'yatay' ? pdfW : pdfH
  const pageH = yon === 'yatay' ? pdfH : pdfW

  const imgW = pageW
  const imgH = (canvas.height * imgW) / canvas.width

  const pngDataUrl = canvas.toDataURL('image/png')
  const pngBytes = fetch(pngDataUrl).then((r) => r.arrayBuffer())

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([pageW, pageH])

  const pngImage = await pdfDoc.embedPng(await pngBytes)
  page.drawImage(pngImage, {
    x: 0,
    y: pageH - imgH,
    width: imgW,
    height: imgH,
  })

  const pdfBytes = await pdfDoc.save()
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
}

export async function htmlToPdf(
  htmlTemplate: string,
  headerData: Record<string, unknown>,
  kalemData: Record<string, unknown>[],
  options: {
    fileName?: string
    boyut?: 'A5' | 'A4'
    yon?: 'yatay' | 'dikey'
    logo?: string
  } = {},
): Promise<void> {
  const { fileName = 'rapor.pdf', boyut = 'A5', yon = 'yatay', logo } = options
  const canvas = await renderToCanvas(htmlTemplate, headerData, kalemData, logo)
  const blob = await canvasToPdfBlob(canvas, boyut, yon)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

export async function htmlToPdfPreview(
  htmlTemplate: string,
  headerData: Record<string, unknown>,
  kalemData: Record<string, unknown>[],
  options: {
    boyut?: 'A5' | 'A4'
    yon?: 'yatay' | 'dikey'
    logo?: string
  } = {},
): Promise<void> {
  const { boyut = 'A5', yon = 'yatay', logo } = options
  const canvas = await renderToCanvas(htmlTemplate, headerData, kalemData, logo)
  const blob = await canvasToPdfBlob(canvas, boyut, yon)
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}
