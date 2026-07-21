import { Module } from '@nestjs/common'
import { NumaratorController } from './numarator.controller'
import { NumaratorService } from './numarator.service'

@Module({
  controllers: [NumaratorController],
  providers: [NumaratorService],
  exports: [NumaratorService],
})
export class NumaratorModule {}
