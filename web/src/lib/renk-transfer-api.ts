import { api } from './api'
import type { TransferSatir, TransferSonuc } from './transfer-types'

export const renkTransferApi = {
  import: (satirlar: TransferSatir[]) =>
    api.post<TransferSonuc>('/renk-transfer/import', { satirlar }),
}