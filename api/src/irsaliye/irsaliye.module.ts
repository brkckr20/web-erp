import { Module } from '@nestjs/common'
import { IrsaliyeController } from './irsaliye.controller'
import { IrsaliyeService } from './irsaliye.service'

@Module({
  controllers: [IrsaliyeController],
  providers: [IrsaliyeService],
  exports: [IrsaliyeService],
})
export class IrsaliyeModule {}
