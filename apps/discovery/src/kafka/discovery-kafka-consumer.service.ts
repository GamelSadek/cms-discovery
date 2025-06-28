import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kafka, Consumer } from 'kafkajs';
import { ConfigService } from '@nestjs/config';
import { DiscoveryProgram } from '../entities/discovery-program.entity';
import { DiscoveryEpisode } from '../entities/discovery-episode.entity';

interface KafkaEvent<T = any> {
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
    programContext?: string;
  };
}

const KAFKA_TOPICS = {
  PROGRAMS: 'cms.programs',
  EPISODES: 'cms.episodes',
};

@Injectable()
export class DiscoveryKafkaConsumerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(DiscoveryKafkaConsumerService.name);
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected = false;

  constructor(
    @InjectRepository(DiscoveryProgram)
    private readonly programRepository: Repository<DiscoveryProgram>,
    @InjectRepository(DiscoveryEpisode)
    private readonly episodeRepository: Repository<DiscoveryEpisode>,
    private readonly configService: ConfigService,
  ) {
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID_DISCOVERY || 'discovery-service',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
      connectionTimeout: 3000,
      requestTimeout: 30000,
    });

    this.consumer = this.kafka.consumer({
      groupId: process.env.KAFKA_GROUP_ID_DISCOVERY || 'discovery-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxWaitTimeInMs: 5000,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });
  }

  async onModuleInit() {
    try {
      await this.consumer.connect();
      this.isConnected = true;

      // Subscribe to CMS topics
      await this.consumer.subscribe({
        topics: [KAFKA_TOPICS.PROGRAMS, KAFKA_TOPICS.EPISODES],
        fromBeginning: false,
      });

      // Start consuming messages
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }: any) => {
          try {
            const event: KafkaEvent = JSON.parse(message.value.toString());
            await this.handleKafkaEvent(topic, event);
          } catch (error) {
            this.logger.error(
              `Error processing Kafka message from ${topic}:`,
              error,
            );
          }
        },
      });
    } catch (error) {
      this.logger.error('Failed to start Discovery Kafka consumer:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.consumer.disconnect();
      this.isConnected = false;
      this.logger.log('Discovery Kafka consumer disconnected');
    }
  }

  private async handleKafkaEvent(
    topic: string,
    event: KafkaEvent,
  ): Promise<void> {
    this.logger.log(
      `Processing ${event.eventType} event for ${event.entityType}:${event.entityId} v${event.version}`,
    );

    try {
      switch (topic) {
        case KAFKA_TOPICS.PROGRAMS:
          await this.handleProgramEvent(event);
          break;
        case KAFKA_TOPICS.EPISODES:
          await this.handleEpisodeEvent(event);
          break;
        default:
          this.logger.warn(`Unknown topic: ${topic}`);
      }
    } catch (error) {
      this.logger.error(`Failed to process event ${event.eventId}:`, error);
      throw error;
    }
  }

  private async handleProgramEvent(event: KafkaEvent): Promise<void> {
    const { eventType, entityId, data, version } = event;

    // Check if we already processed this version
    const existingProgram = await this.programRepository.findOne({
      where: { id: entityId },
    });

    if (existingProgram && existingProgram.kafkaVersion >= version) {
      this.logger.debug(
        `Skipping program ${entityId} - already have version ${existingProgram.kafkaVersion}`,
      );
      return;
    }

    switch (eventType) {
      case 'created':
      case 'updated':
      case 'published':
        if (data && !data.deleted) {
          await this.upsertDiscoveryProgram(data, version);
          this.logger.log(
            `Program ${entityId} synced to Discovery (version ${version})`,
          );
        } else {
          this.logger.debug(`Skipping non-published program ${entityId}`);
        }
        break;

      case 'unpublished':
      case 'deleted':
        await this.removeDiscoveryProgram(entityId);
        this.logger.log(`Program ${entityId} removed from Discovery`);
        break;

      default:
        this.logger.warn(`Unknown program event type: ${eventType}`);
    }
  }

  private async handleEpisodeEvent(event: KafkaEvent): Promise<void> {
    const { eventType, entityId, data, version } = event;

    const existingEpisode = await this.episodeRepository.findOne({
      where: { id: entityId },
    });

    if (existingEpisode && existingEpisode.kafkaVersion >= version) {
      this.logger.debug(
        `Skipping episode ${entityId} - already have version ${existingEpisode.kafkaVersion}`,
      );
      return;
    }

    switch (eventType) {
      case 'created':
      case 'updated':
      case 'published':
        if (data && !data.deleted) {
          await this.upsertDiscoveryEpisode(data, version);
          this.logger.log(
            `Episode ${entityId} synced to Discovery (version ${version})`,
          );
        } else {
          this.logger.debug(`Skipping non-published episode ${entityId}`);
        }
        break;

      case 'unpublished':
      case 'deleted':
        await this.removeDiscoveryEpisode(entityId);
        this.logger.log(`Episode ${entityId} removed from Discovery`);
        break;

      default:
        this.logger.warn(`Unknown episode event type: ${eventType}`);
    }
  }

  private async upsertDiscoveryProgram(
    programData: any,
    version: number,
  ): Promise<void> {
    try {
      // Extract search keywords from text content
      const searchKeywords = this.extractKeywords(
        `${programData.title} ${programData.description} ${programData.tags?.join(' ') || ''}`,
      );

      const discoveryProgram = this.programRepository.create({
        id: programData.id,
        publisherId: programData.publisherId,
        publisherName: programData.publisherName || 'Unknown Publisher',
        title: programData.title,
        description: programData.description,
        shortDescription: programData.shortDescription,
        category: programData.category,
        language: programData.language,
        type: programData.type,
        rating: programData.rating || 0,
        viewCount: programData.viewCount || 0,
        episodeCount: programData.episodeCount || 0,
        thumbnailUrl: programData.thumbnailUrl,
        coverImageUrl: programData.coverImageUrl,
        tags: programData.tags || [],
        isFeatured: programData.isFeatured || false,
        publishedAt: new Date(programData.publishedAt),
        lastUpdated: new Date(programData.lastUpdated),
        searchKeywords,
        kafkaVersion: version,
        syncedAt: new Date(),
      });

      await this.programRepository.save(discoveryProgram);

      // Update search vector for better search performance
      await this.updateProgramSearchVector(programData.id);

      // Update program episode count if needed
      await this.updateProgramEpisodeCount(programData.id);
    } catch (error) {
      this.logger.error(`Failed to upsert program ${programData.id}:`, error);
      throw error;
    }
  }

  private async upsertDiscoveryEpisode(
    episodeData: any,
    version: number,
  ): Promise<void> {
    try {
      const searchKeywords = this.extractKeywords(
        `${episodeData.title} ${episodeData.description} ${episodeData.tags?.join(' ') || ''}`,
      );

      const discoveryEpisode = this.episodeRepository.create({
        id: episodeData.id,
        programId: episodeData.programId,
        programTitle: episodeData.programTitle || 'Unknown Program',
        programCategory: episodeData.programCategory || 'Unknown',
        title: episodeData.title,
        description: episodeData.description,
        processedMediaUrl: episodeData.processedMediaUrl,
        duration: episodeData.duration,
        episodeNumber: episodeData.episodeNumber,
        seasonNumber: episodeData.seasonNumber || 1,
        publishDate: new Date(episodeData.publishDate),
        viewCount: episodeData.viewCount || 0,
        downloadCount: episodeData.downloadCount || 0,
        tags: episodeData.tags || [],
        searchKeywords,
        kafkaVersion: version,
        syncedAt: new Date(),
      });

      await this.episodeRepository.save(discoveryEpisode);

      // Update search vector
      await this.updateEpisodeSearchVector(episodeData.id);

      // Update parent program episode count
      await this.updateProgramEpisodeCount(episodeData.programId);
    } catch (error) {
      this.logger.error(`Failed to upsert episode ${episodeData.id}:`, error);
      throw error;
    }
  }

  private async removeDiscoveryProgram(programId: string): Promise<void> {
    try {
      // Remove all episodes of this program first
      await this.episodeRepository.delete({ programId });

      // Remove the program
      await this.programRepository.delete({ id: programId });

      this.logger.log(
        `Removed program ${programId} and its episodes from Discovery`,
      );
    } catch (error) {
      this.logger.error(`Failed to remove program ${programId}:`, error);
      throw error;
    }
  }

  private async removeDiscoveryEpisode(episodeId: string): Promise<void> {
    try {
      const episode = await this.episodeRepository.findOne({
        where: { id: episodeId },
      });

      if (episode) {
        const programId = episode.programId;
        await this.episodeRepository.delete({ id: episodeId });

        // Update parent program episode count
        await this.updateProgramEpisodeCount(programId);
      }
    } catch (error) {
      this.logger.error(`Failed to remove episode ${episodeId}:`, error);
      throw error;
    }
  }

  private async updateProgramSearchVector(programId: string): Promise<void> {
    try {
      await this.programRepository.query(
        `
        UPDATE discovery_programs 
        SET search_vector = to_tsvector('arabic', 
          COALESCE(title, '') || ' ' || 
          COALESCE(description, '') || ' ' ||
          COALESCE(publisher_name, '') || ' ' ||
          COALESCE(array_to_string(tags, ' '), '')
        )
        WHERE id = $1
      `,
        [programId],
      );
    } catch (error) {
      this.logger.warn(
        `Failed to update search vector for program ${programId}:`,
        error,
      );
    }
  }

  private async updateEpisodeSearchVector(episodeId: string): Promise<void> {
    try {
      await this.episodeRepository.query(
        `
        UPDATE discovery_episodes 
        SET search_vector = to_tsvector('arabic',
          COALESCE(title, '') || ' ' ||
          COALESCE(description, '') || ' ' ||
          COALESCE(program_title, '') || ' ' ||
          COALESCE(array_to_string(tags, ' '), '')
        )
        WHERE id = $1
      `,
        [episodeId],
      );
    } catch (error) {
      this.logger.warn(
        `Failed to update search vector for episode ${episodeId}:`,
        error,
      );
    }
  }

  private async updateProgramEpisodeCount(programId: string): Promise<void> {
    try {
      const episodeCount = await this.episodeRepository.count({
        where: { programId },
      });

      await this.programRepository.update({ id: programId }, { episodeCount });
    } catch (error) {
      this.logger.warn(
        `Failed to update episode count for program ${programId}:`,
        error,
      );
    }
  }

  private extractKeywords(text: string): string[] {
    if (!text) return [];

    const words = text
      .toLowerCase()
      .replace(
        /[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s]/g,
        '',
      ) // Keep Arabic and Latin chars
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .slice(0, 20); // Limit to 20 keywords

    return [...new Set(words)]; // Remove duplicates
  }

  /**
   * Health check for Kafka consumer
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    message: string;
    stats?: any;
  }> {
    try {
      if (!this.isConnected) {
        return { healthy: false, message: 'Kafka consumer not connected' };
      }

      // Get sync statistics
      const stats = await this.getSyncStats();

      return {
        healthy: true,
        message: 'Kafka consumer healthy',
        stats,
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Kafka consumer health check failed: ${error.message}`,
      };
    }
  }

  /**
   * Get synchronization statistics
   */
  async getSyncStats(): Promise<{
    totalPrograms: number;
    totalEpisodes: number;
    lastSyncedProgram?: Date;
    lastSyncedEpisode?: Date;
    oldestContent?: Date;
    newestContent?: Date;
  }> {
    try {
      const [
        programCount,
        episodeCount,
        lastSyncedProgram,
        lastSyncedEpisode,
        oldestProgram,
        newestProgram,
      ] = await Promise.all([
        this.programRepository.count(),
        this.episodeRepository.count(),
        this.programRepository.findOne({
          order: { syncedAt: 'DESC' },
        }),
        this.episodeRepository.findOne({
          order: { syncedAt: 'DESC' },
        }),
        this.programRepository.findOne({
          order: { publishedAt: 'ASC' },
        }),
        this.programRepository.findOne({
          order: { publishedAt: 'DESC' },
        }),
      ]);

      return {
        totalPrograms: programCount,
        totalEpisodes: episodeCount,
        lastSyncedProgram: lastSyncedProgram?.syncedAt,
        lastSyncedEpisode: lastSyncedEpisode?.syncedAt,
        oldestContent: oldestProgram?.publishedAt,
        newestContent: newestProgram?.publishedAt,
      };
    } catch (error) {
      this.logger.error('Failed to get sync stats:', error);
      throw error;
    }
  }

  /**
   * Manual resync for specific entities (for admin operations)
   */
  async requestResync(
    entityType: 'program' | 'episode',
    entityId: string,
  ): Promise<void> {
    this.logger.log(`Manual resync requested for ${entityType}:${entityId}`);
    this.logger.warn(
      `Manual resync not yet implemented for ${entityType}:${entityId}`,
    );
  }
}
