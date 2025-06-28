import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Kafka, Producer, Message } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { KafkaEventEntity } from './kafka-event.entity';

export const KAFKA_TOPICS = {
  PROGRAMS: {
    name: 'cms.programs',
    partitions: 3,
    replicationFactor: 2,
    events: ['created', 'updated', 'published', 'unpublished', 'deleted'],
  },
  EPISODES: {
    name: 'cms.episodes',
    partitions: 6,
    replicationFactor: 2,
    events: ['created', 'updated', 'published', 'unpublished', 'deleted'],
  },
  MEDIA: {
    name: 'cms.media',
    partitions: 2,
    replicationFactor: 2,
    events: ['uploaded', 'processed', 'failed'],
  },
};

export interface KafkaEvent<T = any> {
  eventId: string;
  eventType: string;
  entityType: 'program' | 'episode' | 'publisher' | 'media';
  entityId: string;
  version: number;
  timestamp: Date;
  source: 'cms' | 'discovery';
  data: T | null;
  metadata?: {
    userId?: string;
    sessionId?: string;
    correlationId?: string;
    publisherContext?: string;
  };
}

@Injectable()
export class CmsKafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CmsKafkaProducerService.name);
  private kafka: Kafka;
  private producer: Producer;
  private isConnected = false;

  constructor(
    @InjectRepository(KafkaEventEntity)
    private readonly kafkaEventRepository: Repository<KafkaEventEntity>,
  ) {
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID_CMS || 'cms-service',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
      connectionTimeout: 3000,
      requestTimeout: 30000,
    });

    this.producer = this.kafka.producer({
      idempotent: true,
      transactionTimeout: 30000,
      maxInFlightRequests: 5,
      retry: {
        initialRetryTime: 100,
        retries: 5,
      },
    });
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.isConnected = true;

      await this.createTopics();

      // Start retry mechanism for failed events
      this.startRetryMechanism();
    } catch (error) {
      this.logger.error('Failed to connect Kafka producer:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.producer.disconnect();
      this.isConnected = false;
      this.logger.log('Kafka producer disconnected');
    }
  }

  private async createTopics() {
    const admin = this.kafka.admin();
    try {
      await admin.connect();

      const topicsToCreate = Object.values(KAFKA_TOPICS).map((topic) => ({
        topic: topic.name,
        numPartitions: topic.partitions,
        replicationFactor: topic.replicationFactor,
      }));

      await admin.createTopics({
        topics: topicsToCreate,
        waitForLeaders: true,
      });
    } catch (error) {
      this.logger.warn('Topics might already exist:', error.message);
    } finally {
      await admin.disconnect();
    }
  }

  /**
   * Publish Program Event to Kafka
   * Only published programs are sent to Discovery
   */
  async publishProgramEvent(
    eventType: 'created' | 'updated' | 'published' | 'unpublished' | 'deleted',
    program: any,
    metadata?: any,
  ): Promise<void> {
    try {
      const serializedData = this.serializeProgramForDiscovery(
        program,
        eventType,
      );

      const event: KafkaEvent = {
        eventId: uuidv4(),
        eventType,
        entityType: 'program',
        entityId: program.id,
        version: await this.getNextVersion('program', program.id),
        timestamp: new Date(),
        source: 'cms',
        data: serializedData,
        metadata: {
          ...metadata,
          publisherContext: program.publisherId,
        },
      };

      // Track event in database first
      const kafkaEvent = await this.trackKafkaEvent(
        'program',
        program.id,
        eventType,
        KAFKA_TOPICS.PROGRAMS.name,
        event,
      );

      await this.sendToKafka(KAFKA_TOPICS.PROGRAMS.name, program.id, event);

      await this.markEventAsSent(kafkaEvent.id);

      this.logger.log(`Program ${eventType} event sent for ID: ${program.id}`);
    } catch (error) {
      this.logger.error(`Failed to publish program event:`, error);
      throw error;
    }
  }

  /**
   * Publish Episode Event to Kafka
   * Only published episodes are sent to Discovery
   */
  async publishEpisodeEvent(
    eventType: 'created' | 'updated' | 'published' | 'unpublished' | 'deleted',
    episode: any,
    metadata?: any,
  ): Promise<void> {
    try {
      const serializedData = this.serializeEpisodeForDiscovery(
        episode,
        eventType,
      );

      const event: KafkaEvent = {
        eventId: uuidv4(),
        eventType,
        entityType: 'episode',
        entityId: episode.id,
        version: await this.getNextVersion('episode', episode.id),
        timestamp: new Date(),
        source: 'cms',
        data: serializedData,
        metadata: {
          ...metadata,
          programContext: episode.programId,
        },
      };

      const kafkaEvent = await this.trackKafkaEvent(
        'episode',
        episode.id,
        eventType,
        KAFKA_TOPICS.EPISODES.name,
        event,
      );

      await this.sendToKafka(
        KAFKA_TOPICS.EPISODES.name,
        episode.programId,
        event,
      );

      await this.markEventAsSent(kafkaEvent.id);

      this.logger.log(`Episode ${eventType} event sent for ID: ${episode.id}`);
    } catch (error) {
      this.logger.error(`Failed to publish episode event:`, error);
      throw error;
    }
  }

  /**
   * Serialize Program data for Discovery
   * Returns null for non-published content or deletion events
   */
  private serializeProgramForDiscovery(program: any, eventType: string): any {
    // For deletion events, only send minimal data
    if (eventType === 'deleted' || eventType === 'unpublished') {
      return {
        id: program.id,
        deleted: true,
      };
    }

    // Only send published programs to Discovery
    if (program.status !== 'published') {
      return null;
    }

    return {
      id: program.id,
      publisherId: program.publisherId,
      publisherName: program.publisher?.name,
      title: program.title,
      description: program.description,
      shortDescription: program.shortDescription,
      category: program.category,
      language: program.language,
      type: program.type,
      rating: program.rating || 0,
      viewCount: program.viewCount || 0,
      episodeCount: program.episodes?.length || 0,
      thumbnailUrl: program.thumbnailUrl,
      coverImageUrl: program.coverImageUrl,
      tags: program.tags || [],
      isFeatured: program.isFeatured || false,
      publishedAt: program.publishedAt,
      lastUpdated: program.updatedAt,
    };
  }

  /**
   * Serialize Episode data for Discovery
   * Returns null for non-published content or deletion events
   */
  private serializeEpisodeForDiscovery(episode: any, eventType: string): any {
    // For deletion events, only send minimal data
    if (eventType === 'deleted' || eventType === 'unpublished') {
      return {
        id: episode.id,
        deleted: true,
      };
    }

    // Only send published episodes to Discovery
    if (episode.status !== 'published') {
      return null;
    }

    return {
      id: episode.id,
      programId: episode.programId,
      programTitle: episode.program?.title,
      programCategory: episode.program?.category,
      title: episode.title,
      description: episode.description,
      audioUrl: episode.audioUrl,
      videoUrl: episode.videoUrl,
      duration: episode.duration,
      episodeNumber: episode.episodeNumber,
      seasonNumber: episode.seasonNumber || 1,
      publishDate: episode.publishDate,
      viewCount: episode.viewCount || 0,
      downloadCount: episode.downloadCount || 0,
      tags: episode.tags || [],
    };
  }

  private async sendToKafka(
    topic: string,
    partitionKey: string,
    event: KafkaEvent,
  ): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Kafka producer is not connected');
    }

    const message: Message = {
      key: partitionKey,
      value: JSON.stringify(event),
      timestamp: event.timestamp.getTime().toString(),
      headers: {
        eventType: event.eventType,
        entityType: event.entityType,
        source: event.source,
        version: event.version.toString(),
      },
    };

    await this.producer.send({
      topic,
      messages: [message],
    });
  }

  private async trackKafkaEvent(
    entityType: string,
    entityId: string,
    eventType: string,
    topicName: string,
    event: KafkaEvent,
  ): Promise<KafkaEventEntity> {
    const kafkaEvent = this.kafkaEventRepository.create({
      id: uuidv4(),
      entityType,
      entityId,
      eventType,
      topicName,
      partitionKey: entityId,
      eventData: event,
      status: 'pending',
      retryCount: 0,
      createdAt: new Date(),
    });

    return await this.kafkaEventRepository.save(kafkaEvent);
  }

  private async markEventAsSent(eventId: string): Promise<void> {
    await this.kafkaEventRepository.update(eventId, {
      status: 'sent',
      sentAt: new Date(),
    });
  }

  private async getNextVersion(
    entityType: string,
    entityId: string,
  ): Promise<number> {
    const lastEvent = await this.kafkaEventRepository.findOne({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });

    return lastEvent ? (lastEvent.eventData.version || 0) + 1 : 1;
  }

  /**
   * Retry mechanism for failed events
   */
  private startRetryMechanism(): void {
    setInterval(async () => {
      try {
        const failedEvents = await this.kafkaEventRepository.find({
          where: { status: 'failed', retryCount: LessThan(3) },
          take: 10,
        });

        for (const failedEvent of failedEvents) {
          try {
            await this.sendToKafka(
              failedEvent.topicName,
              failedEvent.partitionKey,
              failedEvent.eventData,
            );

            await this.kafkaEventRepository.update(failedEvent.id, {
              status: 'sent',
              sentAt: new Date(),
            });

            this.logger.log(`Retry successful for event ${failedEvent.id}`);
          } catch (error) {
            await this.kafkaEventRepository.update(failedEvent.id, {
              retryCount: failedEvent.retryCount + 1,
            });

            this.logger.warn(
              `Retry failed for event ${failedEvent.id}:`,
              error.message,
            );
          }
        }
      } catch (error) {
        this.logger.error('Error in retry mechanism:', error);
      }
    }, 30000); // Retry every 30 seconds
  }

  /**
   * Health check for Kafka connection
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    try {
      if (!this.isConnected) {
        return { healthy: false, message: 'Kafka producer not connected' };
      }

      const admin = this.kafka.admin();
      await admin.connect();
      await admin.listTopics();
      await admin.disconnect();

      return { healthy: true, message: 'Kafka connection healthy' };
    } catch (error) {
      return {
        healthy: false,
        message: `Kafka health check failed: ${error.message}`,
      };
    }
  }

  /**
   * Get Kafka metrics for monitoring
   */
  async getMetrics(): Promise<{
    pendingEvents: number;
    sentEvents: number;
    failedEvents: number;
    lastSentAt?: Date;
  }> {
    const [pending, sent, failed] = await Promise.all([
      this.kafkaEventRepository.count({ where: { status: 'pending' } }),
      this.kafkaEventRepository.count({ where: { status: 'sent' } }),
      this.kafkaEventRepository.count({ where: { status: 'failed' } }),
    ]);

    const lastSent = await this.kafkaEventRepository.findOne({
      where: { status: 'sent' },
      order: { sentAt: 'DESC' },
    });

    return {
      pendingEvents: pending,
      sentEvents: sent,
      failedEvents: failed,
      lastSentAt: lastSent?.sentAt,
    };
  }
}
