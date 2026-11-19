'use client'

import { useCallback, useState } from 'react'
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
  tip?: number
}

export default function SearchableMalzemeSelect(props: SearchableMalzemeSelectProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const { filterKodlar, tip } = props
  const filterKey = filterKodlar ? filterKodlar.join(',') : ''

  const fetchList = useCallback(async () => {
    const list = await malzemeApi.list(tip)
    if (!filterKey) return list
    const kodSet = new Set(filterKey.split(','))
    return list.filter((d) => kodSet.has(d.kod))
  }, [tip, filterKey])

  return (
    <>
      <SearchableSelect<Malzeme>
        {...props}
        hideAdLabel
        searchLabel={(d) => `${d.kod} - ${d.ad}`}
        onIconClick={() => setModalOpen(true)}
        fetchList={fetchList}
      />
      <MalzemeSecModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={(kod, rec) => props.onChange?.(kod, rec)}
        tip={tip}
      />
    </>
  )
}
