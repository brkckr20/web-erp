import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common'
import { BedenService } from './beden.service'
import { CreateBedenDto } from './dto/create-beden.dto'
import { UpdateBedenDto } from './dto/update-beden.dto'

@Controller('beden')
export class BedenController {
  constructor(private readonly bedenService: BedenService) {}

  @Get()
  findAll() {
    return this.bedenService.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bedenService.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateBedenDto) {
    return this.bedenService.create(dto)
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBedenDto) {
    return this.bedenService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bedenService.remove(id)
  }
}
