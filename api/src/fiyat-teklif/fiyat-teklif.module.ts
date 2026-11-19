import { Module } from '@nestjs/common'
import { FiyatTeklifService } from './fiyat-teklif.service'
import { FiyatTeklifController } from './fiyat-teklif.controller'

@Module({
  providers: [FiyatTeklifService],
  controllers: [FiyatTeklifController],
})
export class FiyatTeklifModule {}
