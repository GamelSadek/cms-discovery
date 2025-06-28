import { Injectable } from '@nestjs/common';

@Injectable()
export class DiscoveryService {
  getApiInfo() {
    return {
      name: 'Content Discovery API',
      version: '1.0.0',
      description: 'Public API for content discovery and search',
      endpoints: {
        search: '/search',
        programs: '/programs',
        episodes: '/episodes',
        documentation: '/api-docs',
      },
      features: [
        'Content Search',
        'Program Browsing',
        'Episode Discovery',
        'Filtering and Sorting',
        'Pagination',
        'Caching',
      ],
    };
  }
}
