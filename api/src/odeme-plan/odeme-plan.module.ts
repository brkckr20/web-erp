import { Module } from '@nestjs/common'
import { OdemePlanController } from './odeme-plan.controller'
import { OdemePlanService } from './odeme-plan.service'

@Module({
  controllers: [OdemePlanController],
  providers: [OdemePlanService],
})
export class OdemePlanModule {}
