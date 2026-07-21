import { IsOptional, Length } from 'class-validator'

export class UpdateOzellikKodlamaDto {
  @IsOptional()
  @Length(0, 200)
  ad?: string

  @IsOptional()
  @Length(0, 100)
  kategori?: string
}
