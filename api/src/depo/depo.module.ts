import { Module } from '@nestjs/common'
import { DepoController } from './depo.controller'
import { DepoService } from './depo.service'

@Module({
  controllers: [DepoController],
  providers: [DepoService],
})
export class DepoModule {}
