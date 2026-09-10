'use client'

import { useCallback } from 'react'
import SearchableSelect from './SearchableSelect'
import { kullaniciApi, type Kullanici } from '@/lib/kullanici-api'

interface SearchableKullaniciSelectProps {
  value?: string
  onChange?: (kod: string, record?: Kullanici) => void
  placeholder?: string
  className?: string
  widthClass?: string
}

export default function SearchableKullaniciSelect(props: SearchableKullaniciSelectProps) {
  const fetchPage = useCallback(async () => {
    const data = await kullaniciApi.list()
    return data.filter((d) => d.durum).map((d) => ({ id: d.id, kod: d.kod, ad: d.ad } as Kullanici))
  }, [])

  return (
    <SearchableSelect<Kullanici>
      {...props}
      searchLabel={(d) => `${d.kod} - ${d.ad}`}
      fetchList={fetchPage}
    />
  )
}
