'use client'

import { useState, useEffect } from 'react'
import { Select } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { gtipApi, type Gtip } from '@/lib/gtip-api'

interface SearchableGtipSelectProps {
  value?: string | null
  onChange?: (kod: string, record?: Gtip) => void
  placeholder?: string
  widthClass?: string
}

export default function SearchableGtipSelect({ value, onChange, placeholder = 'GTİP ara...', widthClass = '!w-48' }: SearchableGtipSelectProps) {
  const [options, setOptions] = useState<Gtip[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const list = await gtipApi.list()
      setOptions(list.filter((b) => b.kullanimda))
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
      size="small"
      loading={loading}
      value={value ?? undefined}
      placeholder={placeholder}
      suffixIcon={<SearchOutlined style={{ fontSize: 12, color: '#7A7A7A' }} />}
      className={`${widthClass} !text-[11px]`}
      onOpenChange={(open) => { if (open) load() }}
      options={options.map((b) => ({
        label: b.kod,
        value: b.kod,
      }))}
      onChange={(kod: string) => {
        const rec = options.find((b) => b.kod === kod)
        onChange?.(kod, rec)
      }}
      filterOption={(input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
      }
    />
  )
}
