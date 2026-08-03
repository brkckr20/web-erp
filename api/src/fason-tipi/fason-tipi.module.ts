import { Module } from '@nestjs/common'
import { FasonTipiController } from './fason-tipi.controller'
import { FasonTipiService } from './fason-tipi.service'

@Module({
  controllers: [FasonTipiController],
  providers: [FasonTipiService],
})
export class FasonTipiModule {}
