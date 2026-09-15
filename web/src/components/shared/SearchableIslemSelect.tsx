'use client'

import { useState, useEffect } from 'react'
import { Select } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { islemApi, type IslemKarti } from '@/lib/islem-api'

interface SearchableIslemSelectProps {
  value?: string | null
  onChange?: (kod: string | null, record?: IslemKarti) => void
  placeholder?: string
  className?: string
  widthClass?: string
  size?: 'small' | 'middle' | 'large'
}

// İşlem Kartları'ndan searchable işlem seçimi (değer = işlem kodu).
export default function SearchableIslemSelect({
  value,
  onChange,
  placeholder = 'İşlem ara...',
  className,
  widthClass = '!w-full',
  size = 'small',
}: SearchableIslemSelectProps) {
  const [options, setOptions] = useState<IslemKarti[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const list = await islemApi.list()
      setOptions(list.filter((d) => d.aktif))
    } catch {
      setOptions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <Select
      showSearch
      allowClear
      size={size}
      loading={loading}
      value={value || undefined}
      placeholder={placeholder}
      suffixIcon={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />}
      className={`${widthClass} !text-[11px] ${className ?? ''}`}
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
        onChange?.(kod || null, rec)
      }}
      filterOption={(input, option) =>
        ((option as { searchText?: string })?.searchText ?? '').toLowerCase().includes(input.toLowerCase())
      }
    />
  )
}
