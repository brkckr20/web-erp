'use client'

import { Button, Input, Tag, Tabs } from 'antd'
import { PlayCircleOutlined } from '@ant-design/icons'
import type { FormSorguDraft, FormTasarimDraft } from './types'

interface SorguPaneliProps {
  form: FormTasarimDraft
  calisiyorSorguId: string | null
  onSorguGuncelle: (sorguId: string, patch: Partial<FormSorguDraft>) => void
  onSorguCalistir: (sorguId: string) => void
}

export default function SorguPaneli({ form, calisiyorSorguId, onSorguGuncelle, onSorguCalistir }: SorguPaneliProps) {
  return (
    <div className="!h-full !flex !flex-col !gap-2 !p-2.5">
      <div className="!border !border-gray-300 !rounded-sm !bg-[#FAFAFA] !p-3 !flex !flex-col !gap-2 !shrink-0">
        <div className="!text-[11px] !font-semibold !text-[#333]">Veri Kaynağı İsimleri</div>
        <div className="!grid !grid-cols-2 !gap-x-6 !gap-y-1.5">
          {form.sorgular.map((s) => (
            <div key={s.id} className="!flex !items-center !gap-2">
              <span className="!text-[10px] !text-[#6b7280] !w-12 !shrink-0">Sorgu {s.sirano}</span>
              <Input
                size="small"
                className="!w-56"
                value={s.ad}
                placeholder="Veri adı"
                onChange={(e) => onSorguGuncelle(s.id, { ad: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>

      <Tabs
        size="small"
        type="card"
        tabBarGutter={2}
        className="!flex-1 !min-h-0 !flex !flex-col [&_.ant-tabs-content-holder]:!flex [&_.ant-tabs-content]:!flex-1 [&_.ant-tabs-content-holder]:!min-h-0 [&_.ant-tabs-content]:!min-h-0 [&_.ant-tabs-nav]:!mb-0 [&_.ant-tabs-tab]:!text-[11px] [&_.ant-tabs-tab]:!px-2.5 [&_.ant-tabs-tab-active]:!border-t-2 [&_.ant-tabs-tab-active]:!border-t-[#FF9933]"
        items={form.sorgular.map((s) => ({
          key: s.id,
          label: `Sorgu ${s.sirano}`,
          children: (
            <div className="!h-full !flex !flex-col !overflow-hidden">
              <div className="!shrink-0 !flex !items-center !justify-between !mb-1.5">
                <span className="!text-[10px] !text-[#9ca3af]">
                  {s.kolonlar.length > 0 ? `${s.kolonlar.length} kolon yüklendi` : 'Kolonlar henüz yüklenmedi'}
                </span>
                <Button
                  size="small"
                  className="!h-6 !text-[11px]"
                  icon={<PlayCircleOutlined />}
                  loading={calisiyorSorguId === s.id}
                  onClick={() => onSorguCalistir(s.id)}
                >
                  Çalıştır
                </Button>
              </div>
              <div className="!shrink-0 !overflow-y-auto !pt-1.5">
                <Input.TextArea
                  size="small"
                  autoSize={{ minRows: 6, maxRows: 16 }}
                  className="!text-[11px] !font-mono"
                  placeholder="SELECT * FROM stok_hareket_fisi WHERE id = :id"
                  value={s.sorguMetni}
                  onChange={(e) => onSorguGuncelle(s.id, { sorguMetni: e.target.value })}
                />
              </div>
              {s.hata && (
                <div className="!mt-2 !shrink-0 !text-[10px] !text-red-600 !bg-red-50 !border !border-red-200 !rounded-sm !px-2 !py-1.5">
                  {s.hata}
                </div>
              )}
              {s.kolonlar.length > 0 && (
                <div className="!mt-2 !shrink-0 !flex !flex-wrap !gap-1">
                  {s.kolonlar.map((k) => (
                    <Tag key={k} className="!text-[10px] !m-0">
                      {k}
                    </Tag>
                  ))}
                </div>
              )}
              <div className="!flex-1 !min-h-0 !overflow-auto !pt-2">
                <table className="!w-full !text-[10px] !border-collapse">
                  <thead>
                    <tr>
                      {s.kolonlar.map((k) => (
                        <th key={k} className="!border !border-gray-300 !bg-gray-50 !px-1.5 !py-1 !text-left !font-semibold">
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {s.satirlar.slice(0, 5).map((r, ri) => (
                      <tr key={ri}>
                        {s.kolonlar.map((k) => (
                          <td key={k} className="!border !border-gray-300 !px-1.5 !py-0.5">
                            {String(r[k] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ),
        }))}
      />
    </div>
  )
}
