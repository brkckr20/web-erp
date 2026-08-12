import { Module } from '@nestjs/common'
import { TedarikController } from './tedarik.controller'
import { TedarikService } from './tedarik.service'

@Module({
  controllers: [TedarikController],
  providers: [TedarikService],
  exports: [TedarikService],
})
export class TedarikModule {}
