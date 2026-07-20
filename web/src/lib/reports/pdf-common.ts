import type { TDocumentDefinitions } from 'pdfmake/interfaces'

// Tarayıcıda pdfmake'in browser bundle'ını (pdfmake/build/pdfmake) kullanıyoruz.
// Node build'i tarayıcıda progressCallback hatası veriyor. vfs fontları da ayrıca yüklenmeli.

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
  const pdf = pdfMake.createPdf(docDefinition)
  pdf.download(fileName)
}

// PDF'i yeni tarayıcı sekmesinde önizleme olarak açar (kullanıcı oradan indirir).
export async function previewPdf(docDefinition: TDocumentDefinitions): Promise<void> {
  const pdfMake = await loadPdfMake()
  const pdf = pdfMake.createPdf(docDefinition)
  pdf.open(undefined, { title: 'Rapor Önizleme' })
}

async function loadPdfMake(): Promise<any> {
  const pdfmakeMod = await import('pdfmake/build/pdfmake')
  const vfsMod = await import('pdfmake/build/vfs_fonts')
  // Browser bundle'ının varsayılan export'u pdfMake nesnesidir
  const pdfMake = (pdfmakeMod as any).default ?? pdfmakeMod
  const vfs = (vfsMod as any).default ?? vfsMod
  if (typeof pdfMake.addVirtualFileSystem === 'function') {
    pdfMake.addVirtualFileSystem(vfs)
  }
  return pdfMake
}
