import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common'
import { MarkaService } from './marka.service'
import { CreateMarkaDto } from './dto/create-marka.dto'
import { UpdateMarkaDto } from './dto/update-marka.dto'

@Controller('marka')
export class MarkaController {
  constructor(private readonly markaService: MarkaService) {}

  @Get()
  findAll() {
    return this.markaService.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.markaService.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateMarkaDto) {
    return this.markaService.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMarkaDto) {
    return this.markaService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.markaService.remove(id)
  }
}
