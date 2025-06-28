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

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
}

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get port(): number {
    return this.configService.get<number>('PORT', 3000);
  }

  get databaseConfig(): DatabaseConfig {
    return {
      host: this.configService.get<string>('CMS_DB_HOST', 'localhost'),
      port: this.configService.get<number>('CMS_DB_PORT', 5432),
      username: this.configService.getOrThrow<string>('CMS_DB_USERNAME'),
      password: this.configService.getOrThrow<string>('CMS_DB_PASSWORD'),
      database: this.configService.getOrThrow<string>('CMS_DB_NAME'),
      synchronize: !this.isProduction, // Only sync in development
    };
  }

  get kafkaConfig(): KafkaConfig {
    return {
      brokers: this.configService
        .get<string>('KAFKA_BROKERS', 'localhost:9092')
        .split(','),
      clientId: this.configService.get<string>(
        'KAFKA_CLIENT_ID_CMS',
        'cms-service',
      ),
      groupId: this.configService.get<string>(
        'KAFKA_GROUP_ID_CMS',
        'cms-group',
      ),
    };
  }

  get jwtConfig(): JwtConfig {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is required');
    }

    return {
      secret,
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '1d'),
    };
  }

  validateRequiredEnvVars(): void {
    const required = [
      'CMS_DB_HOST',
      'CMS_DB_USERNAME',
      'CMS_DB_PASSWORD',
      'CMS_DB_NAME',
      'JWT_SECRET',
    ];

    const missing = required.filter(
      (key) => !this.configService.get<string>(key),
    );

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`,
      );
    }
  }
}
