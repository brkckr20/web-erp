'use client'

import { useState } from 'react'
import SearchableSelect from './SearchableSelect'
import MalzemeSecModal from './MalzemeSecModal'
import { malzemeApi, type Malzeme } from '@/lib/malzeme-api'

interface SearchableMalzemeSelectProps {
  value?: string
  onChange?: (kod: string, record?: Malzeme) => void
  placeholder?: string
  className?: string
  widthClass?: string
  filterKodlar?: string[]
}

export default function SearchableMalzemeSelect(props: SearchableMalzemeSelectProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const { filterKodlar } = props

  return (
    <>
      <SearchableSelect<Malzeme>
        {...props}
        hideAdLabel
        searchLabel={(d) => `${d.kod} - ${d.ad}`}
        onIconClick={() => setModalOpen(true)}
        fetchList={async () => {
          const list = await malzemeApi.list()
          if (filterKodlar && filterKodlar.length > 0) {
            return list.filter((d) => filterKodlar.includes(d.kod))
          }
          return list
        }}
      />
      <MalzemeSecModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={(kod, rec) => props.onChange?.(kod, rec)}
      />
    </>
  )
}
