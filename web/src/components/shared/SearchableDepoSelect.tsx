'use client'

import SearchableSelect from './SearchableSelect'
import { depoApi, type Depo } from '@/lib/depo-api'

interface SearchableDepoSelectProps {
  value?: string
  onChange?: (kod: string, record?: Depo) => void
  placeholder?: string
  className?: string
  widthClass?: string
}

export default function SearchableDepoSelect(props: SearchableDepoSelectProps) {
  return (
    <SearchableSelect<Depo>
      {...props}
      searchLabel={(d) => `${d.kod} - ${d.ad}`}
      fetchList={async () =>
        (await depoApi.list()).map((d) => ({ id: d.id, kod: d.kod, ad: d.ad } as Depo))
      }
    />
  )
}
