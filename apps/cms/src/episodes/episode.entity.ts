import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Program } from '../programs/programs.entity';

export enum EpisodeStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity()
export class Episode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  titleAr?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  descriptionAr?: string;

  @Column({ type: 'int' })
  duration: number; // in seconds

  @Column({ type: 'int', default: 1 })
  episodeNumber: number;

  @Column({ type: 'int', nullable: true })
  seasonNumber?: number;

  @Column({
    type: 'enum',
    enum: EpisodeStatus,
    default: EpisodeStatus.DRAFT,
  })
  status: EpisodeStatus;

  @Column({ nullable: true })
  originalMediaUrl?: string;

  @Column({ nullable: true })
  processedMediaUrl?: string;

  @Column({ nullable: true })
  thumbnailUrl?: string;

  @Column('simple-array', { nullable: true })
  tags?: string[];

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  likeCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'timestamptz', nullable: true })
  publishDate?: Date;

  @Column({ type: 'jsonb', nullable: true })
  chapters?: {
    title: string;
    startTime: number;
    endTime: number;
    description?: string;
  }[];

  @Column({ nullable: true })
  category?: string;

  @Column({ nullable: true })
  language?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    fileSize?: number;
    format?: string;
    quality?: string;
    [key: string]: any;
  };

  @ManyToOne(() => Program, (program) => program.episodes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'programId' })
  program: Program;

  @Column()
  programId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
