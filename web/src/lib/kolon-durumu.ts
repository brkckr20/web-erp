import type { GridApi } from 'ag-grid-community'
import type { KolonKaydi } from '@/lib/kolon-secimi-api'

/**
 * Kayıtlı kolon durumunu (gizlilik/genişlik/sıra/sıralama) grid'e uygular.
 * Sıralama için moveColumns kullanılır (applyColumnState + applyOrder gridReady
 * sonrasında AG Grid'in kendi kolon işlemesi tarafından ezilebiliyor).
 */
export function applyKolonDurumu<T>(api: GridApi<T>, kayitlar: KolonKaydi[]): boolean {
  if (!kayitlar.length) return false
  const byCol = new Map(kayitlar.map((k) => [k.kolonAdi, k]))
  const colStates = api.getColumnState()
  if (!colStates) return false

  colStates.forEach((cs) => {
    const colId = cs.colId
    if (!colId) return
    const k = byCol.get(colId)
    if (!k) return
    if (cs.hide !== (k.gizli ?? false)) api.setColumnsVisible([colId], !k.gizli)
    if (k.genislik != null && cs.width !== k.genislik) {
      api.setColumnWidths([{ key: colId, newWidth: k.genislik }])
    }
  })

  const siralanan = kayitlar
    .filter((k) => k.sira != null && k.kolonAdi)
    .sort((a, b) => (a.sira as number) - (b.sira as number))
  siralanan.forEach((k, idx) => {
    const allCols = api.getAllGridColumns()
    const fromIdx = allCols.findIndex((c) => c.getColId() === k.kolonAdi)
    if (fromIdx !== idx && fromIdx > -1) api.moveColumns([k.kolonAdi], idx)
  })

  const sortState = kayitlar
    .filter((k) => k.siralamaYon === 'asc' || k.siralamaYon === 'desc')
    .map((k) => ({ colId: k.kolonAdi, sort: k.siralamaYon as 'asc' | 'desc' }))
  if (sortState.length) {
    api.applyColumnState({ state: sortState, defaultState: { sort: null } })
  }
  return true
}
