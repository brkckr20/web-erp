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
import { IadeTalepService } from './iade-talep.service'
import { CreateIadeTalepDto, UpdateIadeTalepDto } from './dto/create-iade-talep.dto'

@Controller('iade-talep')
export class IadeTalepController {
  constructor(private readonly service: IadeTalepService) {}

  @Get()
  findAll(@Query('durum') durum?: string) {
    return this.service.findAll(durum)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateIadeTalepDto) {
    return this.service.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIadeTalepDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }

  @Put(':id/iptal')
  iptal(@Param('id', ParseIntPipe) id: number) {
    return this.service.iptal(id)
  }

  @Post(':id/irsaliye')
  irsaliyeOlustur(@Param('id', ParseIntPipe) id: number) {
    return this.service.irsaliyeOlustur(id)
  }
}
