import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class VoteChoiceDto {
  @IsString()
  @IsNotEmpty()
  voteId!: string;

  @IsString()
  @IsNotEmpty()
  nomineeId!: string;
}

export class SubmitVoteDto {
  @IsString()
  @IsNotEmpty()
  mssv!: string;

  @IsString()
  @IsNotEmpty()
  idToken!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  voteId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nomineeId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VoteChoiceDto)
  choices?: VoteChoiceDto[];
}
