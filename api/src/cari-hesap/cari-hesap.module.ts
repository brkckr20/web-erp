import { Module } from '@nestjs/common'
import { CariHesapController } from './cari-hesap.controller'
import { CariHesapService } from './cari-hesap.service'

@Module({
  controllers: [CariHesapController],
  providers: [CariHesapService],
})
export class CariHesapModule {}
