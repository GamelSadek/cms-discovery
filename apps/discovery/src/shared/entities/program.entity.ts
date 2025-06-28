import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Episode } from './episode.entity';
import { Publisher } from './publisher.entity';

export enum ProgramStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum ProgramType {
  PODCAST = 'podcast',
  DOCUMENTARY = 'documentary',
  SERIES = 'series',
  MOVIE = 'movie',
}

@Entity()
export class Program {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  shortDescription?: string;

  @Column()
  category: string;

  @Column()
  language: string;

  @Column({
    type: 'enum',
    enum: ProgramType,
    default: ProgramType.PODCAST,
  })
  type: ProgramType;

  @Column({
    type: 'enum',
    enum: ProgramStatus,
    default: ProgramStatus.DRAFT,
  })
  status: ProgramStatus;

  @Column({ nullable: true })
  thumbnailUrl?: string;

  @Column({ nullable: true })
  coverImageUrl?: string;

  @Column({ nullable: true })
  trailerUrl?: string;

  @Column('simple-array', { nullable: true })
  tags?: string[];

  @Column({ type: 'int', default: 0 })
  episodeCount: number;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'timestamptz', nullable: true })
  publishDate?: Date;

  @ManyToOne(() => Publisher)
  @JoinColumn({ name: 'publisherId' })
  publisher: Publisher;

  @Column()
  publisherId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Episode, (episode) => episode.program)
  episodes: Episode[];
}
