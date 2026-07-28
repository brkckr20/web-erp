import { Module } from '@nestjs/common'
import { AksesuarTipiController } from './aksesuar-tipi.controller'
import { AksesuarTipiService } from './aksesuar-tipi.service'

@Module({
  controllers: [AksesuarTipiController],
  providers: [AksesuarTipiService],
})
export class AksesuarTipiModule {}