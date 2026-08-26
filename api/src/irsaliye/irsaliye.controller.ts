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
import { IrsaliyeService } from './irsaliye.service'
import { CreateIrsaliyeDto } from './dto/create-irsaliye.dto'
import { UpdateIrsaliyeDto } from './dto/create-irsaliye.dto'
import { CreateIrsaliyeKalemDto } from './dto/create-irsaliye.dto'
import { UpdateIrsaliyeKalemDto } from './dto/create-irsaliye.dto'

@Controller('irsaliye')
export class IrsaliyeController {
  constructor(private readonly service: IrsaliyeService) {}

  @Get('next-irsaliye-no')
  nextIrsaliyeNo(@Query('irsaliyeTipi') irsaliyeTipi: string) {
    return this.service.nextIrsaliyeNo(irsaliyeTipi)
  }

  @Get()
  findAll(@Query('irsaliyeTipi') irsaliyeTipi?: string) {
    return this.service.findAll(irsaliyeTipi)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateIrsaliyeDto) {
    return this.service.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIrsaliyeDto) {
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
  createKalem(@Body() dto: CreateIrsaliyeKalemDto) {
    return this.service.createKalem(dto)
  }

  @Put('kalem/:id')
  updateKalem(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIrsaliyeKalemDto) {
    return this.service.updateKalem(id, dto)
  }

  @Delete('kalem/:id')
  removeKalem(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeKalem(id)
  }
}
