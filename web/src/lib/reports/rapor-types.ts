import type { TDocumentDefinitions } from 'pdfmake/interfaces'

export type { TDocumentDefinitions }

export interface RaporTasarim {
  id: string
  label: string
  aciklama: string
  build: (data: any) => TDocumentDefinitions
}
