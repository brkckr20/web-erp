import { Controller, Get, Post, Delete, Param, ParseIntPipe, Res, UseInterceptors, UploadedFiles, Body, NotFoundException } from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import type { Response } from 'express'
import { MalzemeEkService } from './malzeme-ek.service'

@Controller('malzeme-ek')
export class MalzemeEkController {
  constructor(private readonly service: MalzemeEkService) {}

  @Get(':malzemeId')
  findAll(@Param('malzemeId', ParseIntPipe) malzemeId: number) {
    return this.service.findAll(malzemeId)
  }

  @Post(':malzemeId')
  @UseInterceptors(FilesInterceptor('dosyalar', 20, { limits: { fileSize: 10 * 1024 * 1024 } }))
  async upload(
    @Param('malzemeId', ParseIntPipe) malzemeId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const created: any[] = []
    for (const file of files) {
      created.push(await this.service.create(malzemeId, file))
    }
    return created
  }

  @Get('dosya/:id')
  async download(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const row = await this.service.findOne(id)
    res.set({ 'Content-Type': row.mimetype, 'Content-Disposition': `inline; filename="${row.dosyaAdi}"` })
    res.send(row.data)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}