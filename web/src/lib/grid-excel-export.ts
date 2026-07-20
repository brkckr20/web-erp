import type { GridApi } from 'ag-grid-community'

/**
 * Grid'deki filtrelenmiş + sıralanmış satırları ve görünür kolonları
 * gerçek bir .xlsx dosyası olarak dışa aktarır (exceljs ile).
 */
export async function exportGridToExcel<T>(
  api: GridApi<T>,
  fileName = 'liste',
): Promise<void> {
  const ExcelJS = (await import('exceljs')).default

  // Görünür kolonlar (gizlenenler hariç), sıra/pozisyona göre
  const allCols = api.getAllDisplayedColumns()
  const cols = allCols.filter((c) => {
    const def = c.getColDef()
    // colId "0","1"... veya aksiyon/checkbox kolonlarını başlıksızsa atla
    return def.headerName || def.field
  })

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Liste')

  // Başlık satırı
  sheet.columns = cols.map((c) => {
    const def = c.getColDef()
    return {
      header: def.headerName ?? (def.field as string) ?? '',
      key: c.getColId(),
      width: Math.max(12, Math.round((c.getActualWidth() ?? 100) / 7)),
    }
  })

  // Başlık stili
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, size: 11 }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF9FAFB' },
  }
  headerRow.alignment = { vertical: 'middle' }

  // Satırlar: yalnızca filtre/sıralama sonrası görünen düğümler
  api.forEachNodeAfterFilterAndSort((node) => {
    if (!node.data) return
    const rowValues: Record<string, unknown> = {}
    for (const c of cols) {
      const colId = c.getColId()
      // valueFormatter / valueGetter uygulanmış görünen değeri al
      let value = api.getCellValue({ rowNode: node, colKey: c, useFormatter: true })
      if (value == null) value = ''
      rowValues[colId] = value
    }
    sheet.addRow(rowValues)
  })

  // İnce kenarlık + otomatik filtre
  const lastCol = cols.length
  const lastRow = sheet.rowCount
  if (lastCol > 0) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: lastCol },
    }
  }
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFEEEEEE' } },
        left: { style: 'thin', color: { argb: 'FFEEEEEE' } },
        bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
        right: { style: 'thin', color: { argb: 'FFEEEEEE' } },
      }
    })
  })
  void lastRow

  // İndir
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const stamp = new Date().toISOString().slice(0, 10)
  a.download = `${fileName}-${stamp}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
