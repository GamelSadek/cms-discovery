import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Episode } from '../episodes/episode.entity';

export enum MediaFileType {
  ORIGINAL = 'original',
  PROCESSED = 'processed',
}

export enum MediaFormat {
  MP4 = 'mp4',
  AVI = 'avi',
  MKV = 'mkv',
  MOV = 'mov',
  WMV = 'wmv',
  FLV = 'flv',
  WEBM = 'webm',
  MP3 = 'mp3',
  WAV = 'wav',
  FLAC = 'flac',
  AAC = 'aac',
  OGG = 'ogg',
  M4A = 'm4a',
}

@Entity()
export class MediaFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  originalName: string;

  @Column()
  fileName: string;

  @Column()
  fileUrl: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column({
    type: 'enum',
    enum: MediaFormat,
  })
  format: MediaFormat;

  @Column({
    type: 'enum',
    enum: MediaFileType,
  })
  fileType: MediaFileType;

  @Column()
  mimeType: string;

  @Column({ type: 'int', nullable: true })
  duration?: number; // in seconds

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    width?: number;
    height?: number;
    bitrate?: number;
    codec?: string;
    quality?: string;
    frameRate?: number;
    audioChannels?: number;
    sampleRate?: number;
    [key: string]: any;
  };

  @Column({ type: 'jsonb', nullable: true })
  chapters?: {
    title: string;
    startTime: number;
    endTime: number;
    description?: string;
  }[];

  @Column({ nullable: true })
  thumbnailUrl?: string;

  @Column({ nullable: true })
  category?: string;

  @Column({ nullable: true })
  language?: string;

  @Column({ type: 'timestamp', nullable: true })
  publishDate?: Date;

  @ManyToOne(() => Episode, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'episodeId' })
  episode?: Episode;

  @Column({ nullable: true })
  episodeId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
