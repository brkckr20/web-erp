import { Module } from '@nestjs/common'
import { KasaBankaHesapController } from './kasa-banka-hesap.controller'
import { KasaBankaHesapService } from './kasa-banka-hesap.service'

@Module({
  controllers: [KasaBankaHesapController],
  providers: [KasaBankaHesapService],
})
export class KasaBankaHesapModule {}
