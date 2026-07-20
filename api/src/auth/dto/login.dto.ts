import { IsString, IsOptional } from 'class-validator'

export class LoginDto {
  @IsString()
  kullaniciAdi: string

  @IsString()
  sifre: string

  @IsOptional()
  beniHatirlat?: boolean
}
