import { Module } from '@nestjs/common'
import { StokHareketFisiController } from './stok-hareket-fisi.controller'
import { StokHareketFisiService } from './stok-hareket-fisi.service'

@Module({
  controllers: [StokHareketFisiController],
  providers: [StokHareketFisiService],
})
export class StokHareketFisiModule {}
