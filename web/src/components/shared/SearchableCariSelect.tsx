'use client'

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
  return (
    <SearchableSelect<CariHesap>
      {...props}
      searchLabel={(d) => `${d.kod} - ${d.ad}`}
      fetchList={async () =>
        (await cariHesapApi.list()).map((d) => ({ id: d.id, kod: d.kod, ad: d.ad } as CariHesap))
      }
    />
  )
}
