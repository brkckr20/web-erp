export class CreateDepoRafDto {
  depoId: number
  kod: string
  ad: string
  kat?: number | null
  rafTipi?: string | null
  kapasite?: number | null
  kapasiteBirimi?: string | null
  aktif?: boolean
  sira?: number
  aciklama?: string | null
}
