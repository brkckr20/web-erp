import { Module } from '@nestjs/common'
import { DepoRafController } from './depo-raf.controller'
import { DepoRafService } from './depo-raf.service'

@Module({
  controllers: [DepoRafController],
  providers: [DepoRafService],
  exports: [DepoRafService],
})
export class DepoRafModule {}
