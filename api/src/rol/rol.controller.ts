import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common'
import { RolService } from './rol.service'
import { CreateRolDto, UpdateRolDto } from './dto/rol.dto'
import { Izin } from '../auth/izin.decorator'

@Controller('rol')
@Izin('ayarlar.goruntule')
export class RolController {
  constructor(private readonly service: RolService) {}

  @Get()
  findAll() {
    return this.service.findAll()
  }

  // `:id` rotasından önce tanımlı olmalı; aksi halde ParseIntPipe 400 döndürür.
  @Get('izinler')
  izinler() {
    return this.service.izinler()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  @Izin('ayarlar.kaydet')
  create(@Body() dto: CreateRolDto) {
    return this.service.create(dto)
  }

  @Put(':id')
  @Izin('ayarlar.kaydet')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRolDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @Izin('ayarlar.sil')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}
