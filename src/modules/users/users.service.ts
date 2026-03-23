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

  private normalizeMssv(mssv: string): string {
    return String(mssv || '').trim().toUpperCase();
  }

  findByMssv(mssv: string) {
    return this.voterRepo.findOneBy({ mssv: this.normalizeMssv(mssv) });
  }

  async createVoter(voter: Partial<Voter>) {
    if (voter.mssv) {
      voter.mssv = this.normalizeMssv(voter.mssv);
    }
    if (voter.email) {
      voter.email = String(voter.email).trim().toLowerCase();
    }
    return this.voterRepo.save(voter);
  }

  async createBatch(voters: Partial<Voter>[]) {
    const normalized = voters.map((v) => ({
      ...v,
      mssv: v.mssv ? this.normalizeMssv(v.mssv) : v.mssv,
      email: v.email ? String(v.email).trim().toLowerCase() : v.email,
    }));

    const entities = this.voterRepo.create(normalized);
    return this.voterRepo.save(entities);
  }
}
