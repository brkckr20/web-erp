'use client'

import { useState, useEffect } from 'react'
import { Select } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { renkApi, type Renk } from '@/lib/renk-api'

interface SearchableRenkSelectProps {
  value?: number | null
  onChange?: (id: number | null, record?: Renk) => void
  tip?: number
  placeholder?: string
  className?: string
  widthClass?: string
}

export default function SearchableRenkSelect({
  value,
  onChange,
  tip,
  placeholder = 'Renk ara...',
  className,
  widthClass = '!w-48',
}: SearchableRenkSelectProps) {
  const [options, setOptions] = useState<Renk[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedAd, setSelectedAd] = useState<string>('')

  useEffect(() => {
    let active = true
    setLoading(true)
    renkApi
      .list(tip)
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
  }, [tip])

  useEffect(() => {
    if (value) {
      const rec = options.find((d) => d.id === value)
      setSelectedAd(rec?.ad ?? '')
    } else {
      setSelectedAd('')
    }
  }, [value, options])

  return (
    <div className={`!flex !items-center !gap-2 ${className ?? ''}`}>
      <Select
        showSearch
        allowClear
        size="small"
        loading={loading}
        value={value ?? undefined}
        placeholder={placeholder}
        suffixIcon={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />}
        className={`${widthClass} !text-[11px]`}
        options={options.map((d) => ({
          label: d.kod,
          value: d.id,
          searchText: `${d.kod} - ${d.ad}`,
        }))}
        optionRender={(option: any) => (
          <span className="!text-[11px]">{option.data?.searchText ?? option.data?.label}</span>
        )}
        onChange={(id: number) => {
          const rec = options.find((d) => d.id === id)
          setSelectedAd(rec?.ad ?? '')
          onChange?.(id, rec)
        }}
        filterOption={(input, option) =>
          ((option as { searchText?: string })?.searchText ?? '').toLowerCase().includes(input.toLowerCase())
        }
      />
      <span className="!text-[11px] !text-[#333] !whitespace-nowrap !overflow-visible" title={selectedAd}>
        {selectedAd}
      </span>
    </div>
  )
}