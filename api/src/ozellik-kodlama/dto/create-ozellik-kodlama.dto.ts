import { IsNotEmpty, Length } from 'class-validator'

export class CreateOzellikKodlamaDto {
  @IsNotEmpty()
  @Length(1, 200)
  ad: string

  @IsNotEmpty()
  @Length(1, 100)
  kategori: string
}
