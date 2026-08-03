import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Query,
} from '@nestjs/common'
import { SatisIrsaliyeService } from './satis-irsaliye.service'
import { CreateSatisIrsaliyeDto } from './dto/create-satis-irsaliye.dto'
import { UpdateSatisIrsaliyeDto } from './dto/create-satis-irsaliye.dto'
import { CreateSatisIrsaliyeKalemDto } from './dto/create-satis-irsaliye.dto'
import { UpdateSatisIrsaliyeKalemDto } from './dto/create-satis-irsaliye.dto'

@Controller('satis-irsaliye')
export class SatisIrsaliyeController {
  constructor(private readonly service: SatisIrsaliyeService) {}

  @Get('next-irsaliye-no')
  nextIrsaliyeNo(@Query('irsaliyeTipi') irsaliyeTipi: string) {
    return this.service.nextIrsaliyeNo(irsaliyeTipi)
  }

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateSatisIrsaliyeDto) {
    return this.service.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSatisIrsaliyeDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }

  @Get(':id/kalemler')
  findKalemler(@Param('id', ParseIntPipe) id: number) {
    return this.service.findKalemler(id)
  }

  @Post('kalem')
  createKalem(@Body() dto: CreateSatisIrsaliyeKalemDto) {
    return this.service.createKalem(dto)
  }

  @Put('kalem/:id')
  updateKalem(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSatisIrsaliyeKalemDto) {
    return this.service.updateKalem(id, dto)
  }

  @Delete('kalem/:id')
  removeKalem(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeKalem(id)
  }
}
