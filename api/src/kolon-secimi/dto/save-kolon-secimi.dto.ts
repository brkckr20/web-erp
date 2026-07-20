import { IsString, IsBoolean, IsInt, IsOptional, IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class KolonKaydiDto {
  @IsString()
  kolonAdi: string

  @IsBoolean()
  gizli: boolean

  @IsOptional()
  @IsInt()
  genislik: number | null

  @IsOptional()
  @IsInt()
  sira: number | null

  @IsOptional()
  @IsString()
  siralamaYon: string | null
}

export class SaveKolonSecimiDto {
  @IsString()
  ekranAdi: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KolonKaydiDto)
  kolonlar: KolonKaydiDto[]
}
