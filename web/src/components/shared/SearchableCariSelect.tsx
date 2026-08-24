'use client'

import { useCallback } from 'react'
import SearchableSelect from './SearchableSelect'
import { cariHesapApi, type CariHesap } from '@/lib/cari-hesap-api'

interface SearchableCariSelectProps {
  value?: string
  onChange?: (kod: string, record?: CariHesap) => void
  placeholder?: string
  className?: string
  widthClass?: string
}

export default function SearchableCariSelect(props: SearchableCariSelectProps) {
  const fetchPage = useCallback(async (search?: string) => {
    const data = await cariHesapApi.list(search)
    return data.map((d) => ({ id: d.id, kod: d.kod, ad: d.ad } as CariHesap))
  }, [])

  return (
    <SearchableSelect<CariHesap>
      {...props}
      searchLabel={(d) => `${d.kod} - ${d.ad}`}
      fetchList={() => fetchPage()}
      fetchSearch={(s) => fetchPage(s)}
    />
  )
}
