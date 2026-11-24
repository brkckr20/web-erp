import { Module } from '@nestjs/common'
import { MuhasebeHesapController } from './muhasebe-hesap.controller'
import { MuhasebeHesapService } from './muhasebe-hesap.service'

@Module({
  controllers: [MuhasebeHesapController],
  providers: [MuhasebeHesapService],
  exports: [MuhasebeHesapService],
})
export class MuhasebeHesapModule {}
