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

  async findAll(categoryId?: string) {
    const where = categoryId ? { categoryId } : {};
    const nominees = await this.nomineeRepo.find({
      where,
      relations: ['media'],
      order: { name: 'ASC' },
    });

    return nominees.map((n) => ({
      id: n.id,
      name: n.name,
      description: n.description,
      categoryId: n.categoryId,
      imageUrls: n.media?.map((m) => m.url) ?? [],
    }));
  }

  async findOne(id: string) {
    const nominee = await this.nomineeRepo.findOne({
      where: { id },
      relations: ['media'],
    });
    if (!nominee) {
      return null;
    }

    return {
      id: nominee.id,
      name: nominee.name,
      description: nominee.description,
      categoryId: nominee.categoryId,
      imageUrls: nominee.media?.map((m) => m.url) ?? [],
    };
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

  private async buildMediaForImage(
    nomineeId: string,
    file: Express.Multer.File,
  ): Promise<Media> {
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

    return this.mediaRepo.create({
      nomineeId,
      url: upload.secure_url,
      filename: upload.public_id,
      mimeType: upload.format,
      size: upload.bytes,
    });
  }

  async uploadImage(id: string, file: Express.Multer.File) {
    const media = await this.buildMediaForImage(id, file);
    await this.mediaRepo.save(media);
    return this.findOne(id);
  }

  async createWithImages(
    data: Partial<Nominee>,
    files?: Express.Multer.File[],
  ) {
    const nominee = await this.create(data);

    if (files && files.length) {
      const mediaEntities = await Promise.all(
        files.map((file) => this.buildMediaForImage(nominee.id, file)),
      );
      await this.mediaRepo.save(mediaEntities);
    }

    return this.findOne(nominee.id);
  }

  async uploadImages(id: string, files: Express.Multer.File[]) {
    if (!files || !files.length) {
      throw new BadRequestException('No files provided');
    }

    const mediaEntities = await Promise.all(
      files.map((file) => this.buildMediaForImage(id, file)),
    );

    await this.mediaRepo.save(mediaEntities);
    return this.findOne(id);
  }
}
