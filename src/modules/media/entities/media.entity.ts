import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Nominee } from '../../nominees/entities/nominee.entity';

@Entity({ name: 'media' })
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Nominee, (nominee) => nominee.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'nomineeId' })
  nominee!: Nominee;

  @Column({ type: 'uuid' })
  nomineeId!: string;

  @Column({ type: 'varchar', length: 500 })
  url!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  filename?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  mimeType?: string;

  @Column({ type: 'int', nullable: true })
  size?: number;

  @CreateDateColumn()
  createdAt!: Date;
}
