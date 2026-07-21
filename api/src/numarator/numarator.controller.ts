import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common'
import { NumaratorService } from './numarator.service'
import { CreateNumaratorDto } from './dto/create-numarator.dto'
import { UpdateNumaratorDto } from './dto/update-numarator.dto'

@Controller('numarator')
export class NumaratorController {
  constructor(private readonly numaratorService: NumaratorService) {}

  @Get()
  findAll() {
    return this.numaratorService.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.numaratorService.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateNumaratorDto) {
    return this.numaratorService.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNumaratorDto) {
    return this.numaratorService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.numaratorService.remove(id)
  }
}
