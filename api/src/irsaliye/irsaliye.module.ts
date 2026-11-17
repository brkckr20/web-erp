import { Module } from '@nestjs/common'
import { IrsaliyeController } from './irsaliye.controller'
import { IrsaliyeService } from './irsaliye.service'
import { EIrsaliyeService } from './e-irsaliye.service'

@Module({
  controllers: [IrsaliyeController],
  providers: [IrsaliyeService, EIrsaliyeService],
  exports: [IrsaliyeService],
})
export class IrsaliyeModule {}
