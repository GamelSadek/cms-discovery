import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('kafka_events')
@Index(['entityType', 'entityId'])
@Index(['status'])
@Index(['createdAt'])
export class KafkaEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entity_type', length: 50 })
  entityType: string;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId: string;

  @Column({ name: 'event_type', length: 50 })
  eventType: string;

  @Column({ name: 'topic_name', length: 100 })
  topicName: string;

  @Column({ name: 'partition_key', length: 255 })
  partitionKey: string;

  @Column({ name: 'event_data', type: 'jsonb' })
  eventData: any;

  @Column({ name: 'kafka_offset', type: 'bigint', nullable: true })
  kafkaOffset?: number;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column({
    name: 'status',
    length: 20,
    default: 'pending',
    enum: ['pending', 'sent', 'failed'],
  })
  status: 'pending' | 'sent' | 'failed';

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
