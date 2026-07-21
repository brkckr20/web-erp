import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { OzellikKodlamaService } from './ozellik-kodlama.service';
import { CreateOzellikKodlamaDto } from './dto/create-ozellik-kodlama.dto';
import { UpdateOzellikKodlamaDto } from './dto/update-ozellik-kodlama.dto';

@Controller('ozellik-kodlama')
export class OzellikKodlamaController {
  constructor(private readonly ozellikKodlamaService: OzellikKodlamaService) {}

  @Get()
  findAll(@Query('kategori') kategori?: string) {
    if (kategori) {
      return this.ozellikKodlamaService.findByKategori(kategori);
    }
    return this.ozellikKodlamaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ozellikKodlamaService.findOne(+id);
  }

  @Post()
  create(@Body() createDto: CreateOzellikKodlamaDto) {
    return this.ozellikKodlamaService.create(createDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateOzellikKodlamaDto) {
    return this.ozellikKodlamaService.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ozellikKodlamaService.remove(+id);
  }
}
