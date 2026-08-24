'use client'

import { useState, useEffect, useRef } from 'react'
import { Select } from 'antd'
import { SearchOutlined } from '@ant-design/icons'

interface SearchableItem {
  kod: string
  ad: string
}

interface SearchableSelectProps<T extends SearchableItem> {
  value?: string
  onChange?: (kod: string, record?: T) => void
  placeholder?: string
  className?: string
  widthClass?: string
  fetchList: () => Promise<T[]>
  fetchSearch?: (search: string) => Promise<T[]>
  searchLabel?: (item: T) => string
  hideAdLabel?: boolean
  onIconClick?: () => void
}

export default function SearchableSelect<T extends SearchableItem>({
  value,
  onChange,
  placeholder = 'Kod ara...',
  className,
  widthClass = '!w-48',
  fetchList,
  fetchSearch,
  searchLabel,
  hideAdLabel,
  onIconClick,
}: SearchableSelectProps<T>) {
  const [options, setOptions] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedAd, setSelectedAd] = useState<string>('')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    },
    [],
  )

  const handleSearch = (text: string) => {
    if (!fetchSearch) return
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setLoading(true)
      fetchSearch(text)
        .then((list) => setOptions(list))
        .catch(() => {})
        .finally(() => setLoading(false))
    }, 300)
  }

  const load = async () => {
    setLoading(true)
    try {
      const list = await fetchList()
      setOptions(list)
    } catch {
      setOptions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchList()
      .then((list) => {
        if (active) setOptions(list)
      })
      .catch(() => {
        if (active) setOptions([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [fetchList])

  useEffect(() => {
    if (!value) {
      setSelectedAd('')
      return
    }
    const rec = options.find((d) => d.kod === value)
    if (rec) {
      setSelectedAd(rec.ad)
      return
    }
    if (!fetchSearch) return
    let active = true
    fetchSearch(value)
      .then((list) => {
        const hit = list.find((d) => d.kod === value)
        if (active && hit) setSelectedAd(hit.ad)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [value, options, fetchSearch])

  return (
    <div className={`!flex !items-center !gap-2 ${className ?? ''}`}>
      <Select
        showSearch
        allowClear
        size="small"
        loading={loading}
        value={value || undefined}
        placeholder={placeholder}
        suffixIcon={
          <SearchOutlined
            style={{ fontSize: 12, color: '#7A7A7A', cursor: onIconClick ? 'pointer' : undefined, pointerEvents: onIconClick ? 'auto' : undefined }}
            onMouseDown={onIconClick ? (e) => { e.preventDefault(); e.stopPropagation() } : undefined}
            onClick={onIconClick ? (e) => { e.stopPropagation(); onIconClick() } : undefined}
          />
        }
        className={`${widthClass} !text-[11px]`}
        popupMatchSelectWidth={false}
        onOpenChange={(open) => { if (open) load() }}
        onSearch={fetchSearch ? handleSearch : undefined}
        options={options.map((d) => ({
          label: d.kod,
          value: d.kod,
          searchText: searchLabel ? searchLabel(d) : d.kod,
        }))}
        optionRender={(option: any) => (
          <span className="!text-[11px]">{option.data?.searchText ?? option.data?.label}</span>
        )}
        onChange={(kod: string) => {
          const rec = options.find((d) => d.kod === kod)
          setSelectedAd(rec?.ad ?? '')
          onChange?.(kod, rec)
        }}
        filterOption={
          fetchSearch
            ? false
            : (input, option) =>
                ((option as { searchText?: string })?.searchText ?? '').toLowerCase().includes(input.toLowerCase())
        }
      />
      {!hideAdLabel && <span className="!text-[11px] !text-[#333] !whitespace-nowrap !overflow-visible" title={selectedAd}>{selectedAd}</span>}
    </div>
  )
}
