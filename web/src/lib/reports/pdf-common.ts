import type { TDocumentDefinitions } from 'pdfmake/interfaces'

export const trNumber = (v: number, digits = 2) =>
  (v ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: digits, maximumFractionDigits: digits })

export const trDate = (d?: string | null) => {
  if (!d) return '-'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '-'
  return dt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export async function generatePdf(docDefinition: TDocumentDefinitions, fileName: string): Promise<void> {
  const pdfMake = await loadPdfMake()
  pdfMake.createPdf(docDefinition).download(fileName)
}

export async function previewPdf(docDefinition: TDocumentDefinitions, targetWin?: Window | null): Promise<void> {
  const pdfMake = await loadPdfMake()
  const pdf = pdfMake.createPdf(docDefinition)
  const blob: Blob = await pdf.getBlob()
  const url = URL.createObjectURL(blob)
  const win = targetWin && !targetWin.closed
    ? targetWin
    : window.open(url, '_blank', 'toolbar=0,menubar=0,location=0,status=0,scrollbars=1,width=1100,height=760')
  if (win && !win.closed) {
    if (win === targetWin) win.location.href = url
  } else {
    const link = document.createElement('a')
    link.href = url
    link.target = '_blank'
    link.rel = 'noopener'
    link.click()
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

let pdfMakePromise: Promise<any> | null = null

async function loadPdfMake(): Promise<any> {
  if (pdfMakePromise) return pdfMakePromise
  pdfMakePromise = (async () => {
    const pdfmakeMod = await import('pdfmake/build/pdfmake')
    const vfsMod = await import('pdfmake/build/vfs_fonts')
    const pdfMake = (pdfmakeMod as any).default ?? pdfmakeMod
    const vfsFonts = (vfsMod as any).default ?? vfsMod
    const vfs = vfsFonts.pdfMake?.vfs ?? vfsFonts.vfs ?? vfsFonts
    if (typeof pdfMake.addVirtualFileSystem === 'function') {
      pdfMake.addVirtualFileSystem(vfs)
    } else if (pdfMake.vfs === undefined) {
      pdfMake.vfs = vfs
    }
    if (!pdfMake.fonts) {
      pdfMake.fonts = {
        Roboto: {
          normal: 'Roboto-Regular.ttf',
          bold: 'Roboto-Medium.ttf',
          italics: 'Roboto-Italic.ttf',
          bolditalics: 'Roboto-MediumItalic.ttf',
        },
      }
    }
    return pdfMake
  })().catch((e) => {
    pdfMakePromise = null
    throw e
  })
  return pdfMakePromise
}
