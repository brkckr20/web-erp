'use client'

import { useState, useEffect } from 'react'
import { Select } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { bedenApi, type Beden } from '@/lib/beden-api'

interface SearchableBedenSelectProps {
  value?: number | null
  onChange?: (bedenId: number, record?: Beden) => void
  placeholder?: string
  widthClass?: string
  excludeIds?: number[]
}

export default function SearchableBedenSelect({ value, onChange, placeholder = 'Beden ara...', widthClass = '!w-48', excludeIds = [] }: SearchableBedenSelectProps) {
  const [options, setOptions] = useState<Beden[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    bedenApi.list()
      .then((list) => setOptions(list.filter((b) => b.kullanimda && !excludeIds.includes(b.id))))
      .catch(() => setOptions([]))
  }, [excludeIds])

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
      options={options.map((b) => ({
        label: b.kod,
        value: b.id,
      }))}
      onChange={(bedenId: number) => {
        const rec = options.find((b) => b.id === bedenId)
        onChange?.(bedenId, rec)
      }}
      filterOption={(input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
      }
    />
  )
}
