import { Injectable } from '@nestjs/common';

@Injectable()
export class CmsService {
  getHello(): string {
    return 'thmanyah CMS API is running! Welcome to the Content Management System.';
  }

  getSystemInfo() {
    return {
      name: 'thmanyah CMS API',
      version: '1.0.0',
      description: 'Content Management System for thmanyah multimedia content',
      features: [
        'Arabic/English content support',
        'Program and episode management',
        'AWS S3 media storage',
        'JWT authentication',
        'Real-time Kafka synchronization',
        'Comprehensive API documentation',
      ],
      status: 'active',
      timestamp: new Date().toISOString(),
    };
  }
}
