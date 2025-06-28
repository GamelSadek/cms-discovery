# Thamaniya CMS Discovery System - Technical Documentation

## System Overview

This is a comprehensive Content Management System designed specifically for Thamaniya (ثمانية) to manage and discover multimedia content including podcasts, documentaries, and TV programs. The system is built using modern microservices architecture to handle high traffic loads of up to 10 million users per hour.

## Architecture Design

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Thamaniya CMS Discovery System                        │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Content       │    │   Frontend      │    │   Mobile        │
│   Editors       │    │   Applications  │    │   Applications  │
│   (Internal)    │    │   (Public)      │    │   (Public)      │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │ JWT Auth             │ Public API           │ Public API
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────┐             ┌─────────────────────────────────┐
│   CMS Service   │             │      Discovery Service         │
│   (Port 3000)   │             │        (Port 3001)             │
│                 │             │                                │
│ ┌─────────────┐ │             │ ┌─────────────┐ ┌────────────┐ │
│ │ Auth Module │ │             │ │Search Module│ │Cache Module│ │
│ └─────────────┘ │             │ └─────────────┘ └────────────┘ │
│ ┌─────────────┐ │   Kafka     │ ┌─────────────┐ ┌────────────┐ │
│ │Programs     │ │◄──Events───►│ │Programs     │ │Search      │ │
│ │Module       │ │             │ │Module       │ │Indexing    │ │
│ └─────────────┘ │             │ └─────────────┘ └────────────┘ │
│ ┌─────────────┐ │             │ ┌─────────────┐                │
│ │Episodes     │ │             │ │Episodes     │                │
│ │Module       │ │             │ │Module       │                │
│ └─────────────┘ │             │ └─────────────┘                │
│ ┌─────────────┐ │             │                                │
│ │Media Upload │ │             │                                │
│ │Module       │ │             │                                │
│ └─────────────┘ │             │                                │
└─────────┬───────┘             └─────────┬──────────────────────┘
          │                               │
          ▼                               ▼
┌─────────────────┐             ┌─────────────────┐
│  PostgreSQL     │             │  PostgreSQL     │
│  CMS Database   │             │Discovery Database│
│  (Port 5432)    │             │  (Port 5433)    │
└─────────────────┘             └─────────────────┘
          │                               │
          └─────────────┬─────────────────┘
                        │
                        ▼
                ┌─────────────────┐
                │  Kafka Cluster  │
                │  (Port 9092)    │
                │                 │
                │ Topics:         │
                │ - cms.programs  │
                │ - cms.episodes  │
                │ - cms.media     │
                └─────────────────┘
                        │
                        ▼
                ┌─────────────────┐
                │  Redis Cache    │
                │  (Port 6379)    │
                │                 │
                │ - Search Cache  │
                │ - Session Cache │
                │ - API Cache     │
                └─────────────────┘
                        │
                        ▼
                ┌─────────────────┐
                │   AWS S3        │
                │ Media Storage   │
                │                 │
                │ - Original Files│
                │ - Processed     │
                │ - Thumbnails    │
                └─────────────────┘
```

## Technology Stack

### Backend Framework
- **NestJS**: Modern Node.js framework with TypeScript
- **TypeScript**: Type-safe development for better code quality
- **Express**: Underlying HTTP server

### Databases
- **PostgreSQL**: Primary database for both CMS and Discovery services
- **Redis**: High-performance caching layer

### Message Queue
- **Apache Kafka**: Real-time event streaming between services

### File Storage
- **AWS S3**: Scalable cloud storage for media files

### Documentation
- **Swagger/OpenAPI**: Comprehensive API documentation

## System Components

### 1. CMS Service (Content Management System)
**Port**: 3000  
**Purpose**: Internal content management for editors

#### Key Features:
- **Authentication**: JWT-based security for content editors
- **Program Management**: Create, update, delete TV programs, podcasts, documentaries
- **Episode Management**: Manage individual episodes with metadata
- **Media Upload**: Direct integration with AWS S3 for file storage
- **Real-time Sync**: Automatic Kafka event publishing

#### Modules:
- **Auth Module**: User authentication and authorization
- **Programs Module**: Program CRUD operations
- **Episodes Module**: Episode CRUD operations
- **Publishers Module**: Publisher management
- **Media Module**: Advanced file upload and processing system
- **Kafka Producer Module**: Event publishing

#### Media Processing System:
The CMS includes a sophisticated media processing pipeline:

1. **Original File Storage**: All uploaded files are stored in their original format on AWS S3 for archival purposes
2. **Metadata Extraction**: System automatically extracts technical metadata from uploaded files (duration, resolution, codec, etc.)
3. **Publisher Data Integration**: Combines extracted metadata with publisher-provided information (title, description, tags)
4. **Format Optimization**: Converts media files to optimized MP4 format suitable for web streaming
5. **Dual Storage**: Maintains both original and processed versions with complete metadata embedded

**Supported Features**:
- Multiple input formats (MP4, AVI, MOV, MP3, WAV, etc.)
- Automatic codec detection and conversion
- Quality optimization for web delivery
- Metadata preservation and enhancement
- Thumbnail generation for video content

### 2. Discovery Service (Public Content Discovery)
**Port**: 3001  
**Purpose**: Public-facing content discovery and search

#### Key Features:
- **Advanced Search**: Multi-language search with Arabic support
- **High Performance**: Redis caching for optimal response times
- **Real-time Updates**: Kafka consumer for live content synchronization
- **Public API**: No authentication required for content browsing

#### Modules:
- **Search Module**: Advanced search functionality
- **Programs Module**: Public program browsing
- **Episodes Module**: Public episode discovery
- **Cache Module**: Redis-based caching
- **Kafka Consumer Module**: Event consumption and processing

## Data Flow and Synchronization

### 1. Content Creation Flow
```
Editor → CMS API → Database → Kafka Event → Discovery Service → Search Index
```

### 2. Media Upload and Processing Flow
```
Editor → Upload Request → CMS Service → Original File (S3) → Processing Service → Optimized MP4 (S3) → Database Update → Kafka Event
```

### 3. Content Discovery Flow
```
User → Discovery API → Cache Check → Database Query → Formatted Response
```

### 4. Real-time Synchronization
- **Create/Update**: CMS publishes events → Discovery consumes and syncs
- **Delete**: CMS publishes deletion event → Discovery removes content
- **Publish/Unpublish**: CMS manages visibility → Discovery reflects changes

## API Endpoints

### CMS API (http://localhost:3000/api/docs)
- `POST /auth/login` - Editor authentication
- `GET /programs` - List programs with filtering
- `POST /programs` - Create new program
- `PUT /programs/:id` - Update program
- `DELETE /programs/:id` - Delete program
- `GET /episodes` - List episodes
- `POST /episodes` - Create new episode
- `POST /upload/media` - Upload media files

### Discovery API (http://localhost:3001/api/docs)
- `GET /search` - Advanced content search
- `GET /programs` - Browse public programs
- `GET /programs/:id` - Get program details
- `GET /episodes` - Browse public episodes
- `GET /episodes/:id` - Get episode details

## Arabic Content Support

### Database Level
- Arabic text fields: `titleAr`, `descriptionAr`, `shortDescriptionAr`
- Unicode support for proper Arabic text storage
- Arabic-specific indexing for search optimization

### API Level
- Bilingual API responses
- Language-specific search capabilities
- Locale-aware content delivery

### Search Features
- Arabic text search across all content fields
- Mixed Arabic/English search support
- Arabic keyword extraction and indexing

## Scalability Features

### High Availability
- **Microservices Architecture**: Independent service scaling
- **Database Separation**: Isolated databases prevent bottlenecks
- **Load Balancing**: Multiple service instances support

### Performance Optimization
- **Redis Caching**: Frequently accessed content cached
- **Database Indexing**: Optimized queries for large datasets
- **CDN Integration**: AWS S3 with CloudFront for media delivery

### Event-Driven Architecture
- **Asynchronous Processing**: Non-blocking operations
- **Event Sourcing**: Complete audit trail of changes
- **Eventual Consistency**: Distributed system reliability

## Development Setup

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL
- Redis
- Apache Kafka

### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd cms-discovery

# Start infrastructure
docker-compose up -d

# Install dependencies
npm install

# Start development servers
npm run start:cms:dev    # CMS Service (Port 3000)
npm run start:discovery:dev  # Discovery Service (Port 3001)
```

### Environment Configuration
The system uses a comprehensive `.env` file with all necessary configuration:
- Database connections
- Kafka configuration
- Redis settings
- AWS S3 credentials
- JWT secrets

## Security Considerations

### Authentication
- JWT tokens for CMS access
- No authentication required for Discovery (public content)
- Secure token validation and refresh

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration

### File Upload Security
- File type validation
- Size limits
- Virus scanning (recommended for production)

## Monitoring and Logging

### Application Logging
- Structured logging with NestJS Logger
- Request/response logging
- Error tracking and alerting

### System Monitoring
- Kafka topic monitoring
- Database performance metrics
- Redis cache hit rates
- API response times

## Production Deployment

### Docker Deployment
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Environment Variables
- Strong JWT secrets
- Production database credentials
- AWS S3 production buckets
- SSL certificates

### Performance Tuning
- Database connection pooling
- Redis memory optimization
- Kafka partition scaling
- Load balancer configuration

## Testing

### Unit Tests
- Service layer testing
- Controller testing
- Utility function testing

### Integration Tests
- API endpoint testing
- Database integration testing
- Kafka event testing

### E2E Tests
- Complete user workflow testing
- Cross-service communication testing

## Future Enhancements

### Suggested Improvements
1. **Elasticsearch Integration**: Advanced search capabilities
2. **GraphQL API**: Flexible data querying
3. **Real-time Notifications**: WebSocket integration
4. **Analytics Dashboard**: Content performance metrics
5. **Content Moderation**: Automated content filtering
6. **Multi-tenant Support**: Multiple publisher isolation

### Scalability Enhancements
1. **Database Sharding**: Horizontal scaling
2. **Microservice Mesh**: Service discovery and routing
3. **Event Sourcing**: Complete event history
4. **CQRS Pattern**: Command-Query separation

This system provides a solid foundation for Thamaniya's content management needs while maintaining high performance, scalability, and Arabic language support.
