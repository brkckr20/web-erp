import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common'
import { HizmetTalepService } from './hizmet-talep.service'
import {
  CreateHizmetTalepDto,
  UpdateHizmetTalepDto,
  CreateHizmetTalepNotDto,
  CreateHizmetTalepDosyaDto,
} from './dto/create-hizmet-talep.dto'

@Controller('hizmet-talep')
export class HizmetTalepController {
  constructor(private readonly service: HizmetTalepService) {}

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateHizmetTalepDto) {
    return this.service.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateHizmetTalepDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }

  @Post('not')
  addNot(@Body() dto: CreateHizmetTalepNotDto) {
    return this.service.addNot(dto)
  }

  @Delete('not/:id')
  removeNot(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeNot(id)
  }

  @Post('dosya')
  addDosya(@Body() dto: CreateHizmetTalepDosyaDto) {
    return this.service.addDosya(dto)
  }

  @Delete('dosya/:id')
  removeDosya(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeDosya(id)
  }
}
