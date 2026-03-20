import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Voter } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Voter)
    private readonly voterRepo: Repository<Voter>,
  ) {}

  findByMssv(mssv: string) {
    return this.voterRepo.findOneBy({ mssv });
  }

  async createVoter(voter: Partial<Voter>) {
    return this.voterRepo.save(voter);
  }

  async createBatch(voters: Partial<Voter>[]) {
    const entities = this.voterRepo.create(voters);
    return this.voterRepo.save(entities);
  }
}
