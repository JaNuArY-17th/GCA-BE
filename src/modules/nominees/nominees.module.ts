import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NomineesController } from './nominees.controller';
import { NomineesService } from './nominees.service';
import { Nominee } from './entities/nominee.entity';
import { Media } from '../media/entities/media.entity';
import { CloudinaryService } from '@common/services/cloudinary.service';

@Module({
  imports: [TypeOrmModule.forFeature([Nominee, Media])],
  controllers: [NomineesController],
  providers: [NomineesService, CloudinaryService],
  exports: [NomineesService],
})
export class NomineesModule {}
