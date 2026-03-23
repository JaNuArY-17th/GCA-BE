/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { FileFilterCallback } from 'multer';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { NomineesService } from './nominees.service';
import { Nominee } from './entities/nominee.entity';

@Controller('nominees')
export class NomineesController {
  constructor(private readonly nomineesService: NomineesService) {}

  @Get()
  findAll(@Query('category') categoryId?: string) {
    return this.nomineesService.findAll(categoryId);
  }

  @Get('category/:categoryId')
  findByCategoryId(@Param('categoryId') categoryId: string) {
    return this.nomineesService.findAll(categoryId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.nomineesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file: Express.Multer.File, cb: FileFilterCallback) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        cb(null, allowed.includes(file.mimetype));
      },
    }),
  )
  create(
    @Body() dto: Partial<Nominee>,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    if (files && files.length > 0) {
      return this.nomineesService.createWithImages(dto, files);
    }
    return this.nomineesService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file: Express.Multer.File, cb: FileFilterCallback) => {
        const typed = file;
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        cb(null, allowed.includes(typed.mimetype));
      },
    }),
  )
  uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.nomineesService.uploadImage(id, file);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/images')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file: Express.Multer.File, cb: FileFilterCallback) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        cb(null, allowed.includes(file.mimetype));
      },
    }),
  )
  uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.nomineesService.uploadImages(id, files);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<Nominee>) {
    return this.nomineesService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.nomineesService.delete(id);
  }
}
