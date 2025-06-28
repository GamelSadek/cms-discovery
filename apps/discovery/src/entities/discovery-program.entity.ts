import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('discovery_programs')
@Index(['searchVector'], { fulltext: true })
@Index(['category'])
@Index(['language'])
@Index(['type'])
@Index(['isFeatured'])
@Index(['publishedAt'])
@Index(['rating'])
@Index(['viewCount'])
@Index(['publisherId'])
@Index(['kafkaVersion'])
@Index(['syncedAt'])
export class DiscoveryProgram {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'publisher_id', type: 'uuid' })
  publisherId: string;

  @Column({ name: 'publisher_name', length: 255 })
  publisherName: string;

  @Column({ length: 255 })
  title: string;

  @Column({ name: 'title_ar', length: 255, nullable: true })
  titleAr?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'description_ar', type: 'text', nullable: true })
  descriptionAr?: string;

  @Column({ name: 'short_description', length: 500, nullable: true })
  shortDescription?: string;

  @Column({ name: 'short_description_ar', length: 500, nullable: true })
  shortDescriptionAr?: string;

  @Column({ length: 100 })
  category: string;

  @Column({ length: 10, default: 'ar' })
  language: string;

  @Column({ length: 50, default: 'podcast' })
  type: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.0 })
  rating: number;

  @Column({ name: 'view_count', type: 'int', default: 0 })
  viewCount: number;

  @Column({ name: 'episode_count', type: 'int', default: 0 })
  episodeCount: number;

  @Column({ name: 'thumbnail_url', length: 500, nullable: true })
  thumbnailUrl?: string;

  @Column({ name: 'cover_image_url', length: 500, nullable: true })
  coverImageUrl?: string;

  @Column({ type: 'text', array: true, default: [] })
  tags: string[];

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ name: 'published_at', type: 'timestamp' })
  publishedAt: Date;

  @Column({ name: 'last_updated', type: 'timestamp' })
  lastUpdated: Date;

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
