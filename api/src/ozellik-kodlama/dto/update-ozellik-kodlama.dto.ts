import { IsOptional, Length } from 'class-validator'

export class UpdateOzellikKodlamaDto {
  @IsOptional()
  @Length(0, 50)
  malzemeTuru?: string

  @IsOptional()
  @Length(0, 200)
  labelAdi?: string

  @IsOptional()
  @Length(0, 500)
  aciklama?: string
}