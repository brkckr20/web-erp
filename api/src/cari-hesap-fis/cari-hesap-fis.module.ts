import { Module } from '@nestjs/common'
import { CariHesapFisController } from './cari-hesap-fis.controller'
import { CariHesapFisService } from './cari-hesap-fis.service'

@Module({
  controllers: [CariHesapFisController],
  providers: [CariHesapFisService],
})
export class CariHesapFisModule {}
