import { Module } from '@nestjs/common'
import { KolonSecimiController } from './kolon-secimi.controller'
import { KolonSecimiService } from './kolon-secimi.service'

@Module({
  controllers: [KolonSecimiController],
  providers: [KolonSecimiService],
})
export class KolonSecimiModule {}
