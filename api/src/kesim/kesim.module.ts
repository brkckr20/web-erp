import { Module } from '@nestjs/common'
import { KesimController } from './kesim.controller'
import { KesimService } from './kesim.service'

@Module({
  controllers: [KesimController],
  providers: [KesimService],
  exports: [KesimService],
})
export class KesimModule {}
