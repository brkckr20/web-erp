'use client'

import { useState, useEffect } from 'react'
import { Select } from 'antd'
import { SearchOutlined, PlusOutlined } from '@ant-design/icons'
import { App } from 'antd'
import { kumasGrupApi, type KumasGrup } from '@/lib/kumas-grup-api'

interface SearchableKumasGrupSelectProps {
  value?: number | null
  onChange?: (kumasGrupId: number, record?: KumasGrup) => void
  placeholder?: string
  widthClass?: string
  excludeIds?: number[]
}

export default function SearchableKumasGrupSelect({ value, onChange, placeholder = 'Kumaş grubu ara...', widthClass = '!w-48', excludeIds = [] }: SearchableKumasGrupSelectProps) {
  const { message } = App.useApp()
  const [options, setOptions] = useState<KumasGrup[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    kumasGrupApi.list()
      .then((list) => setOptions(list.filter((b) => b.kullanimda && !excludeIds.includes(b.id))))
      .catch(() => setOptions([]))
  }, [excludeIds])

  const handleCreate = async () => {
    if (!searchText.trim()) return
    setLoading(true)
    try {
      const created = await kumasGrupApi.create({ kod: searchText.trim(), kullanimda: true })
      setOptions((prev) => [...prev, created])
      onChange?.(created.id, created)
      setSearchText('')
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Kumaş grubu oluşturulamadı')
    } finally {
      setLoading(false)
    }
  }

  const canCreate = searchText.trim() && !options.some((o) => o.kod.toLowerCase() === searchText.trim().toLowerCase())

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
      onSearch={(v) => setSearchText(v)}
      options={options.map((b) => ({ label: b.kod, value: b.id }))}
      onChange={(val: unknown) => {
        if (val != null && typeof val === 'number') {
          const rec = options.find((b) => b.id === val)
          onChange?.(val, rec)
        }
      }}
      filterOption={(input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
      }
      popupRender={(menu) => (
        <div>
          {menu}
          {canCreate && (
            <div
              className="!flex !items-center !gap-2 !px-3 !py-1.5 !cursor-pointer !text-[11px] !text-[#FF9933] hover:!bg-gray-50 !border-t !border-gray-100"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
              onClick={() => handleCreate()}
            >
              <PlusOutlined style={{ fontSize: 11 }} />
              <span>"{searchText.trim()}" Ekle</span>
            </div>
          )}
        </div>
      )}
    />
  )
}
