import { Module } from '@nestjs/common'
import { RotaController } from './rota.controller'
import { RotaService } from './rota.service'

@Module({
  controllers: [RotaController],
  providers: [RotaService],
  exports: [RotaService],
})
export class RotaModule {}
