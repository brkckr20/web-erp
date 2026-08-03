import { Module } from '@nestjs/common'
import { SatisIrsaliyeController } from './satis-irsaliye.controller'
import { SatisIrsaliyeService } from './satis-irsaliye.service'

@Module({
  controllers: [SatisIrsaliyeController],
  providers: [SatisIrsaliyeService],
  exports: [SatisIrsaliyeService],
})
export class SatisIrsaliyeModule {}
