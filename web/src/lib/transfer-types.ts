export interface TransferSatir {
  [key: string]: string | number | boolean | null | undefined
}

export interface TransferAtlanan {
  kod: string
  neden: string
}

export interface TransferSonuc {
  toplam: number
  eklenen: number
  atlanan: TransferAtlanan[]
}