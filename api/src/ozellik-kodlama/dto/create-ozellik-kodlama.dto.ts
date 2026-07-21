import { IsNotEmpty, IsOptional, Length } from 'class-validator'

export class CreateOzellikKodlamaDto {
  @IsNotEmpty()
  @Length(1, 50)
  malzemeTuru: string

  @IsNotEmpty()
  @Length(1, 200)
  labelAdi: string

  @IsOptional()
  @Length(0, 500)
  aciklama?: string
}