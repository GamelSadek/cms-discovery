# thmanyah CMS Discovery System

A scalable Content Management System designed for thmanyah (ثمانية) to manage and discover multimedia content including podcasts, documentaries, and TV programs.

## System Architecture

This system consists of two main microservices designed to handle up to 10 million users per hour:

### 1. CMS Service (Content Management System) - Port 3000
Internal system for content editors and managers to:
- **Program Management**: Create and manage TV programs, podcasts, documentaries (similar to thmanyah YouTube content)
- **Metadata Management**: Handle Arabic/English titles, descriptions, categories, languages, duration, and publication dates
- **Media Upload**: AWS S3 integration for scalable media storage
- **Authentication**: JWT-based security for content editors
- **Real-time Publishing**: Kafka events for instant content synchronization

### 2. Discovery Service (Public Content Discovery) - Port 3001
Public-facing system for content discovery:
- **Advanced Search**: Multi-language search with Arabic support
- **Content Browsing**: Program and episode discovery
- **High Performance**: Redis caching for optimal user experience
- **Real-time Updates**: Kafka consumption for live content updates
- **Mobile-Optimized**: Designed for web and mobile applications

## Technical Stack

- **Backend Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with separate databases for each service
- **Caching**: Redis for high-performance content delivery
- **Message Queue**: Apache Kafka for real-time event streaming
- **File Storage**: AWS S3 for scalable media management
- **Documentation**: Swagger/OpenAPI for frontend developers
- **Architecture**: Microservices with low coupling and clear module boundaries

## Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed

### Setup and Run
```bash
# Clone the repository
git clone <repository-url>
cd cms-discovery

# Quick setup (Windows)
.\setup-docker.bat

# Quick setup (Linux/Mac)
chmod +x setup-docker.sh
./setup-docker.sh
```

### Manual Docker Setup
```bash
# Start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
# The .env file contains all necessary configuration
# Edit .env with your specific configuration if needed
```

3. Start with Docker:
```bash
docker-compose up -d
```

4. Or start locally:
```bash
# Start CMS service
npm run start:cms:dev

# Start Discovery service (in another terminal)
npm run start:discovery:dev
```

## Services

### CMS Service (Port 3000)
- Program and Episode management
- User authentication (JWT)
- Media upload to S3
- Kafka event publishing
- API Documentation: http://localhost:3000/api

### Discovery Service (Port 3001)
- Public content search
- Content discovery APIs
- Kafka event consumption
- Redis caching for performance
- API Documentation: http://localhost:3001/api

### Supporting Services
- **PostgreSQL CMS**: localhost:5432
- **PostgreSQL Discovery**: localhost:5433
- **Apache Kafka**: localhost:9092
- **Kafka UI**: http://localhost:8080
- **Redis Cache**: localhost:6379

## Configuration

### Docker Environment
The system uses Docker container hostnames for service communication:
- Database hosts: `cms-postgres`, `discovery-postgres`
- Kafka broker: `kafka:29092`
- Redis host: `redis`

### Required Environment Variables

#### Database (Docker)
- `CMS_DB_HOST=cms-postgres`
- `DISCOVERY_DB_HOST=discovery-postgres`
- Database credentials are configured in docker-compose.yml

#### AWS S3 (for media storage)
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY` 
- `AWS_REGION`
- `AWS_S3_BUCKET`

#### JWT Authentication
- `JWT_SECRET`
- `JWT_EXPIRES_IN`

#### Kafka (Docker)
- `KAFKA_BROKERS=kafka:29092`

## Production Deployment

1. Update environment variables for production
2. Configure proper AWS S3 credentials
3. Set strong JWT secrets
4. Use Docker Compose with production settings:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```
