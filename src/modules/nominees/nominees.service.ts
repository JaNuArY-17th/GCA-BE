/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-redundant-type-constituents */

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CloudinaryService } from '@common/services/cloudinary.service';
import { Media } from '@modules/media/entities/media.entity';
import { Nominee } from './entities/nominee.entity';

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

@Injectable()
export class NomineesService {
  constructor(
    @InjectRepository(Nominee)
    private readonly nomineeRepo: Repository<Nominee>,
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  findAll(categoryId?: string) {
    const where = categoryId ? { categoryId } : {};
    return this.nomineeRepo.find({
      where,
      order: { name: 'ASC' },
    });
  }

  findOne(id: string) {
    return this.nomineeRepo.findOneBy({ id });
  }

  create(data: Partial<Nominee>) {
    const entity = this.nomineeRepo.create(data);
    return this.nomineeRepo.save(entity);
  }

  async update(id: string, data: Partial<Nominee>) {
    await this.nomineeRepo.update(id, data);
    return this.findOne(id);
  }

  delete(id: string) {
    return this.nomineeRepo.delete(id);
  }

  async uploadImage(id: string, file: Express.Multer.File) {
    const typed = file as Express.Multer.File | undefined;
    if (!typed || !typed.buffer) {
      throw new BadRequestException('No file provided');
    }

    const { mimetype, size, buffer } = typed;
    if (!ALLOWED_IMAGE_TYPES.includes(mimetype)) {
      throw new BadRequestException('Unsupported image type');
    }

    if (size > MAX_IMAGE_BYTES) {
      throw new BadRequestException('Image too large (max 5MB)');
    }

    const upload = (await this.cloudinaryService.uploadImage(
      buffer,
      'nominees',
    )) as unknown as {
      secure_url: string;
      width?: number;
      height?: number;
      format?: string;
      bytes?: number;
      public_id?: string;
    };

    await this.mediaRepo.save(
      this.mediaRepo.create({
        nomineeId: id,
        url: upload.secure_url,
        filename: upload.public_id,
        mimeType: upload.format,
        size: upload.bytes,
      }),
    );

    return this.findOne(id);
  }
}
