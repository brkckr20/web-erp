'use client'

import { forwardRef, useMemo, useRef, useState, useImperativeHandle, useCallback } from 'react'
import { Button, Popover, Checkbox } from 'antd'
import { SettingOutlined, FileExcelOutlined } from '@ant-design/icons'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import type { ColDef, GridApi, GridOptions } from 'ag-grid-community'
import { antGridTheme } from '@/lib/ag-grid-theme'
import { agGridLocaleTR } from '@/lib/ag-grid-locale'
import { exportGridToExcel } from '@/lib/grid-excel-export'
import { useAuth } from '@/context/AuthContext'
import { kolonSecimiApi, type KolonKaydi } from '@/lib/kolon-secimi-api'

const kolonLayoutKey = (ekranAdi: string, kullaniciId?: number | null) =>
  `kolon_layout_${kullaniciId ?? 'anonim'}_${ekranAdi}`

function loadLayout(ekranAdi: string, kullaniciId?: number | null): KolonKaydi[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(kolonLayoutKey(ekranAdi, kullaniciId))
    return raw ? (JSON.parse(raw) as KolonKaydi[]) : []
  } catch {
    return []
  }
}

function saveLayout(kayitlar: KolonKaydi[], ekranAdi: string, kullaniciId?: number | null) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(kolonLayoutKey(ekranAdi, kullaniciId), JSON.stringify(kayitlar))
  } catch {
    /* sessiz */
  }
}

ModuleRegistry.registerModules([AllCommunityModule])

export interface DataGridHandle {
  api: GridApi | null
}

interface DataGridProps<T> extends Omit<GridOptions<T>, 'theme' | 'localeText'> {
  columnDefs: ColDef<T>[]
  rowData: T[]
  /** Kolon göster/gizle çarkını göster (varsayılan: true) */
  enableColumnChooser?: boolean
  /** Excel'e aktar butonunu göster (varsayılan: true) */
  enableExcelExport?: boolean
  /** Excel dosya adı (tarih otomatik eklenir, varsayılan: 'liste') */
  exportFileName?: string
  /** Grid dış sarmalayıcı için ekstra class */
  wrapperClassName?: string
  /** Grid yüksekliği (varsayılan: %100) */
  height?: number | string
  /** Kolon tercihlerini (gizli/genişlik/sıra/sıralama) localStorage'da kullanıcı+ekran bazlı saklar. */
  storageKey?: string
}

function DataGridInner<T>(
  {
    columnDefs,
    rowData,
    enableColumnChooser = true,
    enableExcelExport = true,
    exportFileName = 'liste',
    wrapperClassName,
    height = '100%',
    headerHeight = 32,
    rowHeight = 30,
    defaultColDef,
    storageKey,
    ...rest
  }: DataGridProps<T>,
  ref: React.Ref<DataGridHandle>,
) {
  const { kullanici } = useAuth()
  const gridApiRef = useRef<GridApi<T> | null>(null)
  const loadingRef = useRef(false)
  const dbLoadApplied = useRef(false)

  const chooserCols = useMemo(
    () =>
      columnDefs
        .map((c) => ({
          id: (c.colId ?? (c.field as string)) || '',
          label: c.headerName ?? (c.field as string) ?? '',
          hide: (c as any).hide === true,
        }))
        .filter((c) => c.id && c.label),
    [columnDefs],
  )

  const [hiddenCols, setHiddenCols] = useState<Set<string>>(
    () => new Set(chooserCols.filter((c) => c.hide).map((c) => c.id)),
  )
  const [chooserOpen, setChooserOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const syncHiddenColsFromGrid = useCallback(() => {
    const api = gridApiRef.current
    if (!api) return
    const states = api.getColumnState()
    if (!states) return
    setHiddenCols(new Set(states.filter((s) => s.hide).map((s) => s.colId)))
  }, [])

  useImperativeHandle(ref, () => ({ get api() { return gridApiRef.current } }), [])

  const applyKolonKayitlari = useCallback((api: GridApi<T>, kayitlar: KolonKaydi[]) => {
    if (!kayitlar.length) return
    const byCol = new Map(kayitlar.map((k) => [k.kolonAdi, k]))
    const colStates = api.getColumnState()
    if (!colStates) return

    colStates.forEach((cs) => {
      const colId = (cs.colId ?? (cs as any).field) as string | undefined
      if (!colId) return
      const k = byCol.get(colId)
      if (!k) return
      if (k.gizli !== undefined && cs.hide !== k.gizli) {
        api.setColumnsVisible([colId], !k.gizli)
      }
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
      if (fromIdx !== idx && fromIdx > -1) {
        api.moveColumns([k.kolonAdi], idx)
      }
    })

    const sortState = kayitlar
      .filter((k) => k.siralamaYon === 'asc' || k.siralamaYon === 'desc')
      .map((k) => ({ colId: k.kolonAdi, sort: k.siralamaYon as 'asc' | 'desc' }))
    if (sortState.length) {
      api.applyColumnState({ state: sortState, defaultState: { sort: null } })
    }
  }, [])

  const tryLoadFromDb = useCallback((api: GridApi<T>) => {
    if (!storageKey || !kullanici?.id || dbLoadApplied.current) return
    kolonSecimiApi.get(storageKey)
      .then((dbKayitlar) => {
        if (dbKayitlar.length > 0) {
          const lsKayitlar = loadLayout(storageKey, kullanici?.id)
          if (lsKayitlar.length === 0) {
            applyKolonKayitlari(api, dbKayitlar)
          }
        }
        dbLoadApplied.current = true
        syncHiddenColsFromGrid()
      })
      .catch(() => { dbLoadApplied.current = true; syncHiddenColsFromGrid() })
  }, [storageKey, kullanici?.id, applyKolonKayitlari, syncHiddenColsFromGrid])

  const handleExcelExport = async () => {
    if (!gridApiRef.current) return
    setExporting(true)
    try {
      await exportGridToExcel(gridApiRef.current, exportFileName)
    } finally {
      setExporting(false)
    }
  }

  // localStorage'dan kayıtlı kolon tercihlerini oku ve uygula
  const applySavedLayout = useCallback(
    (api: GridApi<T>) => {
      if (!storageKey) return
      loadingRef.current = true
      try {
        const kayitlar = loadLayout(storageKey)
        const byCol = new Map<string, KolonKaydi>(
          kayitlar.map((k) => [k.kolonAdi, k]),
        )
        if (byCol.size === 0) return

        // Gizlilik + genişlik
        const colStates = api.getColumnState()
        if (!colStates) return
        colStates.forEach((cs) => {
          const colId = (cs.colId ?? (cs as any).field) as string | undefined
          if (!colId) return
          const k = byCol.get(colId)
          if (!k) return
          if (k.gizli !== undefined && cs.hide !== k.gizli) {
            api.setColumnsVisible([colId], !k.gizli)
          }
          if (k.genislik != null && cs.width !== k.genislik) {
            api.setColumnWidths([{ key: colId, newWidth: k.genislik }])
          }
        })

        // Sıra (en düşük siradan başa doğru taşı)
        const siralanan = kayitlar
          .filter((k) => k.sira != null && k.kolonAdi)
          .sort((a, b) => (a.sira as number) - (b.sira as number))
        siralanan.forEach((k, idx) => {
          const allCols = api.getAllGridColumns()
          const fromIdx = allCols.findIndex((c) => c.getColId() === k.kolonAdi)
          if (fromIdx !== idx && fromIdx > -1) {
            api.moveColumns([k.kolonAdi], idx)
          }
        })

        // Sıralama yönü
        const sortState = kayitlar
          .filter((k) => k.siralamaYon === 'asc' || k.siralamaYon === 'desc')
          .map((k) => ({ colId: k.kolonAdi, sort: k.siralamaYon as 'asc' | 'desc' }))
        if (sortState.length) {
          api.applyColumnState({ state: sortState, defaultState: { sort: null } })
        }
      } finally {
        loadingRef.current = false
      }
    },
    [storageKey],
  )

  // Mevcut kolon durumunu toplayıp localStorage + DB'ye kaydet (debounce'lu)
  const doSave = useCallback(() => {
    const api = gridApiRef.current
    if (!api || !storageKey || loadingRef.current) return
    const states = api.getColumnState()
    if (!states) return
    const kolonlar: KolonKaydi[] = states
      .map((cs) => ({
        kolonAdi: (cs.colId ?? (cs as any).field) as string | undefined,
        gizli: !!cs.hide,
        genislik: typeof cs.width === 'number' ? Math.round(cs.width) : null,
        sira: 0,
        siralamaYon: cs.sort ?? null,
      }))
      .filter((k) => !!k.kolonAdi)
      .map((k, idx) => ({ ...k, kolonAdi: k.kolonAdi as string, sira: idx }))
    if (kolonlar.length === 0) return
    saveLayout(kolonlar, storageKey)
    if (kullanici?.id) {
      kolonSecimiApi.save(storageKey, kolonlar).catch(() => {})
    }
  }, [storageKey, kullanici?.id])

  const toggleCol = (id: string, visible: boolean) => {
    setHiddenCols((prev) => {
      const next = new Set(prev)
      if (visible) next.delete(id)
      else next.add(id)
      return next
    })
    gridApiRef.current?.setColumnsVisible([id], visible)
  }

  const columnChooserContent = (
    <div className="!flex !flex-col !gap-1 !max-h-80 !overflow-auto !min-w-40">
      {chooserCols.map((c) => (
        <Checkbox
          key={c.id}
          checked={!hiddenCols.has(c.id)}
          onChange={(e) => toggleCol(c.id, e.target.checked)}
          className="!text-[12px]"
        >
          {c.label}
        </Checkbox>
      ))}
      <Button
        type="primary"
        size="small"
        className="!mt-2 !text-[12px]"
        onClick={() => {
          doSave()
          setChooserOpen(false)
        }}
      >
        Kaydet
      </Button>
    </div>
  )

  return (
    <div className={`!flex !flex-col !w-full ${wrapperClassName ?? ''}`} style={{ height }}>
      {(enableColumnChooser || enableExcelExport) && (
        <div className="!flex !justify-end !items-center !gap-1 !flex-shrink-0">
          {enableExcelExport && (
            <Button
              size="small"
              type="text"
              icon={<FileExcelOutlined />}
              loading={exporting}
              onClick={handleExcelExport}
              className="!h-[28px] !text-[12px] !text-[#217346]"
              title="Filtrelenmiş satırları Excel'e aktar"
            >
              Excel
            </Button>
          )}
          {enableColumnChooser && (
            <Popover
              content={columnChooserContent}
              title={<span className="!text-[12px] !font-semibold">Sütunlar</span>}
              trigger="click"
              placement="bottomRight"
              open={chooserOpen}
              onOpenChange={setChooserOpen}
            >
              <Button
                size="small"
                type="text"
                icon={<SettingOutlined />}
                className="!h-[28px] !w-[28px] !text-[#6b7280]"
                title="Sütunları göster/gizle"
              />
            </Popover>
          )}
        </div>
      )}
      <div className="!flex-1 !min-h-0">
        <AgGridReact<T>
          theme={antGridTheme}
          localeText={agGridLocaleTR}
          columnDefs={columnDefs}
          rowData={rowData}
          headerHeight={headerHeight}
          rowHeight={rowHeight}
          onGridReady={(e) => {
            gridApiRef.current = e.api
            applySavedLayout(e.api)
            syncHiddenColsFromGrid()
            tryLoadFromDb(e.api)
            rest.onGridReady?.(e)
          }}
          defaultColDef={{ sortable: true, filter: true, resizable: true, ...defaultColDef }}
          {...rest}
        />
      </div>
    </div>
  )
}

// forwardRef + generic bileşen
const DataGrid = forwardRef(DataGridInner) as <T>(
  props: DataGridProps<T> & { ref?: React.Ref<DataGridHandle> },
) => ReturnType<typeof DataGridInner>

export default DataGrid
