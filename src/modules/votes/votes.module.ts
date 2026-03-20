import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';
import { Voter } from '@modules/users/entities/user.entity';
import { Vote } from './entities/vote.entity';
import { Category } from '../categories/entities/category.entity';
import { Nominee } from '../nominees/entities/nominee.entity';
import { Media } from '../media/entities/media.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Voter, Vote, Category, Nominee, Media])],
  controllers: [VotesController],
  providers: [VotesService],
  exports: [VotesService],
})
export class VotesModule {}
