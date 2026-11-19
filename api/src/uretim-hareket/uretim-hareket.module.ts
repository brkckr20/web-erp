import { Module } from '@nestjs/common'
import { UretimHareketController } from './uretim-hareket.controller'
import { UretimHareketService } from './uretim-hareket.service'

@Module({
  controllers: [UretimHareketController],
  providers: [UretimHareketService],
  exports: [UretimHareketService],
})
export class UretimHareketModule {}
