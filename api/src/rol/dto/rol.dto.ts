export class CreateRolDto {
  ad: string
  aciklama?: string
  aktif?: boolean
  izinIdler?: number[]
}

export class UpdateRolDto {
  ad: string
  aciklama?: string
  aktif?: boolean
  izinIdler?: number[]
}
