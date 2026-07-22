import { Module } from '@nestjs/common'
import { KaliteKontrolController } from './kalite-kontrol.controller'
import { KaliteKontrolService } from './kalite-kontrol.service'
import { StokHareketFisiModule } from '../stok-hareket-fisi/stok-hareket-fisi.module'

@Module({
  imports: [StokHareketFisiModule],
  controllers: [KaliteKontrolController],
  providers: [KaliteKontrolService],
})
export class KaliteKontrolModule {}
