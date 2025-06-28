import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
}

export interface KafkaConfig {
  brokers: string[];
  clientId: string;
  groupId: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  ttl: number;
}

export interface AppConfig {
  port: number;
  environment: string;
  allowedOrigins: string[];
}

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get databaseConfig(): DatabaseConfig {
    return {
      host: this.configService.get('DISCOVERY_DB_HOST', 'localhost'),
      port: this.configService.get('DISCOVERY_DB_PORT', 5433),
      username: this.configService.get(
        'DISCOVERY_DB_USERNAME',
        'discovery_user',
      ),
      password: this.configService.get(
        'DISCOVERY_DB_PASSWORD',
        'discovery_password',
      ),
      database: this.configService.get('DISCOVERY_DB_NAME', 'discovery_db'),
      synchronize: !this.isProduction, // Only sync in development
    };
  }

  get kafkaConfig(): KafkaConfig {
    return {
      brokers: this.configService
        .get<string>('KAFKA_BROKERS', 'localhost:9092')
        .split(','),
      clientId: this.configService.get<string>(
        'KAFKA_CLIENT_ID_DISCOVERY',
        'discovery-service',
      ),
      groupId: this.configService.get<string>(
        'KAFKA_GROUP_ID_DISCOVERY',
        'discovery-group',
      ),
    };
  }

  get redisConfig(): RedisConfig {
    return {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      ttl: this.configService.get<number>('REDIS_TTL', 3600),
    };
  }

  get appConfig(): AppConfig {
    return {
      port: this.configService.get('DISCOVERY_PORT', 3001),
      environment: this.configService.get('NODE_ENV', 'development'),
      allowedOrigins: this.configService
        .get('ALLOWED_ORIGINS', 'http://localhost:3000')
        .split(','),
    };
  }

  get isDevelopment(): boolean {
    return this.appConfig.environment === 'development';
  }

  get isProduction(): boolean {
    return this.appConfig.environment === 'production';
  }
}
