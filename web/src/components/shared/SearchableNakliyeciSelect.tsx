'use client'

import { useCallback } from 'react'
import SearchableSelect from './SearchableSelect'
import { nakliyeciApi, type Nakliyeci } from '@/lib/nakliyeci-api'

// SearchableSelect unvanı "kod" olarak taşır; seçilen kayıtla form alanları doldurulur.
export type NakliyeciOption = Omit<Nakliyeci, 'ad'> & { kod: string; ad: string }

interface SearchableNakliyeciSelectProps {
  value?: string
  onChange?: (unvan: string, record?: Nakliyeci) => void
  placeholder?: string
  className?: string
  widthClass?: string
  hideAdLabel?: boolean
}

export default function SearchableNakliyeciSelect(props: SearchableNakliyeciSelectProps) {
  const fetchList = useCallback(async () => {
    const list = await nakliyeciApi.list()
    // ad alanı orijinal değeriyle korunur (form otomatik doldurma için);
    // görünen etiket ve arama metni unvan/ad/soyad/plaka birleşimidir.
    return list.map(
      (n) =>
        ({
          ...n,
          kod: n.unvan,
          ad: n.ad ?? '',
        }) as NakliyeciOption,
    )
  }, [])

  const plakaText = (n: NakliyeciOption) => (n.plakalar ?? []).map((p) => p.plaka).join(', ')

  return (
    <SearchableSelect<NakliyeciOption>
      {...props}
      placeholder={props.placeholder ?? 'Nakliyeci ara...'}
      searchLabel={(d) =>
        [d.unvan, [d.ad, d.soyad].filter(Boolean).join(' '), plakaText(d)].filter(Boolean).join(' - ')
      }
      // Seçili değerin yanında ünvan dışındaki bilgiler de görünür olsun;
      // ad alanı form otomatik doldurma için ham değerini korur.
      adLabel={(n) =>
        [[n.ad, n.soyad].filter(Boolean).join(' '), plakaText(n)].filter(Boolean).join(' - ')
      }
      fetchList={fetchList}
    />
  )
}
