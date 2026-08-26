import { Module } from '@nestjs/common'
import { KaliteKontrolController } from './kalite-kontrol.controller'
import { KaliteKontrolService } from './kalite-kontrol.service'
import { IrsaliyeModule } from '../irsaliye/irsaliye.module'

@Module({
  imports: [IrsaliyeModule],
  controllers: [KaliteKontrolController],
  providers: [KaliteKontrolService],
})
export class KaliteKontrolModule {}
