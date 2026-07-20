'use client'

import SearchableSelect from './SearchableSelect'
import { isEmriApi, type IsEmri } from '@/lib/is-emri-api'

interface IsEmriOption extends IsEmri {
  kod: string
  ad: string
}

interface SearchableIsEmriSelectProps {
  value?: string
  onChange?: (kod: string, record?: IsEmri) => void
  placeholder?: string
  className?: string
  widthClass?: string
}

export default function SearchableIsEmriSelect(props: SearchableIsEmriSelectProps) {
  return (
    <SearchableSelect<IsEmriOption>
      {...props}
      hideAdLabel
      searchLabel={(d) => `${d.isEmriNo} - ${d.siparisNo ?? ''}`}
      fetchList={async () =>
        (await isEmriApi.list()).map((d) => ({ ...d, kod: d.isEmriNo, ad: d.siparisNo ?? d.isEmriNo }))
      }
    />
  )
}
