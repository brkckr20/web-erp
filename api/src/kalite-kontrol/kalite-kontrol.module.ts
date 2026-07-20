import { Module } from '@nestjs/common'
import { KaliteKontrolController } from './kalite-kontrol.controller'
import { KaliteKontrolService } from './kalite-kontrol.service'

@Module({
  controllers: [KaliteKontrolController],
  providers: [KaliteKontrolService],
})
export class KaliteKontrolModule {}
