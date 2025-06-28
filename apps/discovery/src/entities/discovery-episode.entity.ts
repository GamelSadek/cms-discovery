import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('discovery_episodes')
@Index(['searchVector'], { fulltext: true })
@Index(['programId'])
@Index(['programCategory'])
@Index(['publishDate'])
@Index(['viewCount'])
@Index(['episodeNumber'])
@Index(['seasonNumber'])
@Index(['kafkaVersion'])
@Index(['syncedAt'])
export class DiscoveryEpisode {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'program_id', type: 'uuid' })
  programId: string;

  @Column({ name: 'program_title', length: 255 })
  programTitle: string;

  @Column({ name: 'program_category', length: 100 })
  programCategory: string;

  @Column({ length: 255 })
  title: string;

  @Column({ name: 'title_ar', length: 255, nullable: true })
  titleAr?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'description_ar', type: 'text', nullable: true })
  descriptionAr?: string;

  @Column({ name: 'processed_media_url', length: 500, nullable: true })
  processedMediaUrl?: string;

  @Column({ type: 'int', nullable: true })
  duration?: number;

  @Column({ name: 'episode_number', type: 'int', nullable: true })
  episodeNumber?: number;

  @Column({ name: 'season_number', type: 'int', default: 1 })
  seasonNumber: number;

  @Column({ name: 'publish_date', type: 'timestamp' })
  publishDate: Date;

  @Column({ name: 'view_count', type: 'int', default: 0 })
  viewCount: number;

  @Column({ name: 'download_count', type: 'int', default: 0 })
  downloadCount: number;

  @Column({ type: 'text', array: true, default: [] })
  tags: string[];

  @Column({
    name: 'search_vector',
    type: 'tsvector',
    nullable: true,
    select: false,
  })
  searchVector?: string;

  @Column({ name: 'search_keywords', type: 'text', array: true, default: [] })
  searchKeywords: string[];

  @Column({ name: 'kafka_version', type: 'int', default: 1 })
  kafkaVersion: number;

  @CreateDateColumn({ name: 'synced_at' })
  syncedAt: Date;
}
