import { Module } from '@nestjs/common'
import { IsEmriController } from './is-emri.controller'
import { IsEmriService } from './is-emri.service'

@Module({
  controllers: [IsEmriController],
  providers: [IsEmriService],
})
export class IsEmriModule {}
