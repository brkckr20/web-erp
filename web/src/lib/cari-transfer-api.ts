import { api } from './api'
import type { TransferSatir, TransferSonuc } from './transfer-types'

export const cariTransferApi = {
  import: (satirlar: TransferSatir[]) =>
    api.post<TransferSonuc>('/cari-transfer/import', { satirlar }),
}