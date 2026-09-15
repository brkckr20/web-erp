'use client'

import { useState, useEffect } from 'react'
import { Select } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { rotaApi, type Rota } from '@/lib/rota-api'

interface SearchableRotaSelectProps {
  value?: string | null
  onChange?: (kod: string | null, record?: Rota) => void
  placeholder?: string
  className?: string
  widthClass?: string
}

// Rota Tanımları'ndan searchable rota seçimi (değer = rota kodu).
export default function SearchableRotaSelect({
  value,
  onChange,
  placeholder = 'Rota ara...',
  className,
  widthClass = '!w-48',
}: SearchableRotaSelectProps) {
  const [options, setOptions] = useState<Rota[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedAd, setSelectedAd] = useState<string>('')

  const load = async () => {
    setLoading(true)
    try {
      const list = await rotaApi.list()
      setOptions(list.filter((d) => d.kullanimda))
    } catch {
      setOptions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (value) {
      const rec = options.find((d) => d.kod === value)
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
        onOpenChange={(open) => { if (open) load() }}
        options={options.map((d) => ({
          label: d.kod,
          value: d.kod,
          searchText: `${d.kod} - ${d.ad}`,
        }))}
        optionRender={(option: any) => (
          <span className="!text-[11px]">{option.data?.searchText ?? option.data?.label}</span>
        )}
        onChange={(kod: string) => {
          const rec = options.find((d) => d.kod === kod)
          setSelectedAd(rec?.ad ?? '')
          onChange?.(kod ?? null, rec)
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
