import { Module } from '@nestjs/common'
import { IslemController } from './islem.controller'
import { IslemService } from './islem.service'

@Module({
  controllers: [IslemController],
  providers: [IslemService],
  exports: [IslemService],
})
export class IslemModule {}
