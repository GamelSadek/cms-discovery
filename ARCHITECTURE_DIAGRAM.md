# Thamaniya CMS Discovery System - Architecture Diagram

## System Architecture Overview

```
                    ┌─────────────────────────────────────────────────────┐
                    │             Thamaniya Platform                      │
                    │          Content Management & Discovery             │
                    └─────────────────────────────────────────────────────┘

┌─────────────────────────┐                    ┌─────────────────────────┐
│      Content Editors    │                    │    Public Users         │
│       (Internal)        │                    │    (External)           │
├─────────────────────────┤                    ├─────────────────────────┤
│ • Content Managers      │                    │ • Web App Users         │
│ • Video Editors         │                    │ • Mobile App Users      │
│ • Publishers            │                    │ • API Consumers         │
└─────────────┬───────────┘                    └─────────────┬───────────┘
              │                                              │
              │ JWT Authentication                           │ Public Access
              │                                              │
              ▼                                              ▼
┌─────────────────────────┐                    ┌─────────────────────────┐
│     CMS Service         │                    │   Discovery Service     │
│     (Port 3000)         │◄──── Kafka ─────►  │     (Port 3001)         │
│                         │     Events         │                         │
│ ┌─────────────────────┐ │                    │ ┌─────────────────────┐ │
│ │   Auth Module       │ │                    │ │  Search Module      │ │
│ │   - JWT Security    │ │                    │ │  - Arabic Search    │ │
│ │   - User Management │ │                    │ │  - Advanced Filter  │ │
│ └─────────────────────┘ │                    │ └─────────────────────┘ │
│                         │                    │                         │
│ ┌─────────────────────┐ │                    │ ┌─────────────────────┐ │
│ │  Programs Module    │ │                    │ │ Programs Module     │ │
│ │  - CRUD Operations  │ │                    │ │ - Browse Content    │ │
│ │  - Media Management │ │                    │ │ - View Details      │ │
│ └─────────────────────┘ │                    │ └─────────────────────┘ │
│                         │                    │                         │
│ ┌─────────────────────┐ │                    │ ┌─────────────────────┐ │
│ │  Episodes Module    │ │                    │ │ Episodes Module     │ │
│ │  - Episode CRUD     │ │                    │ │ - Episode Discovery │ │
│ │  - Metadata Mgmt    │ │                    │ │ - Content Filtering │ │
│ └─────────────────────┘ │                    │ └─────────────────────┘ │
│                         │                    │                         │
│ ┌─────────────────────┐ │                    │ ┌─────────────────────┐ │
│ │   Media Module      │ │                    │ │   Cache Module      │ │
│ │   - File Upload     │ │                    │ │   - Redis Caching   │ │
│ │   - AWS S3 Storage  │ │                    │ │   - Performance Opt │ │
│ └─────────────────────┘ │                    │ └─────────────────────┘ │
│                         │                    │                         │
│ ┌─────────────────────┐ │                    │ ┌─────────────────────┐ │
│ │  Kafka Producer     │ │                    │ │  Kafka Consumer     │ │
│ │  - Event Publishing │ │                    │ │  - Event Processing │ │
│ │  - Data Sync        │ │                    │ │  - Auto Sync        │ │
│ └─────────────────────┘ │                    │ └─────────────────────┘ │
└─────────────┬───────────┘                    └─────────────┬───────────┘
              │                                              │
              ▼                                              ▼
┌─────────────────────────┐                    ┌─────────────────────────┐
│    CMS PostgreSQL      │                     │  Discovery PostgreSQL  │
│    Database             │                    │    Database             │
│    (Port 5432)          │                    │    (Port 5433)          │
├─────────────────────────┤                    ├─────────────────────────┤
│ Tables:                 │                    │ Tables:                 │
│ • programs              │                    │ • discovery_programs    │
│ • episodes              │                    │ • discovery_episodes    │
│ • publishers            │                    │ • search_cache          │
│ • media_files           │                    │ • sync_status           │
│ • kafka_events          │                    │                         │
│ • users                 │                    │ Optimized for:          │
│                         │                    │ • Fast Queries          │
│ Features:               │                    │ • Search Performance    │
│ • ACID Transactions     │                    │ • Read Scalability      │
│ • Foreign Keys          │                    │ • Caching Support       │
│ • Arabic Text Support   │                    │ • Arabic Indexing       │
└─────────────┬───────────┘                    └─────────────┬───────────┘
              │                                              │
              └─────────────────┬─────────────────────────────┘
                                │
                                ▼
                ┌─────────────────────────────────────────┐
                │         Infrastructure Layer            │
                └─────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ Apache Kafka │    │   Redis Cache    │    │     AWS S3       │
│ (Port 9092)  │    │   (Port 6379)    │    │  Media Storage   │
├──────────────┤    ├──────────────────┤    ├──────────────────┤
│ Topics:      │    │ Cache Types:     │    │ Buckets:         │
│              │    │                  │    │                  │
│ • cms.       │    │ • Search Results │    │ • thamaniya-     │
│   programs   │    │ • API Responses  │    │   media-original │
│              │    │ • Session Data   │    │                  │
│ • cms.       │    │ • User Prefs     │    │ • thamaniya-     │
│   episodes   │    │                  │    │   media-processed│
│              │    │ Features:        │    │                  │
│ • cms.media  │    │ • TTL Support    │    │ • thamaniya-     │
│              │    │ • Clustering     │    │   thumbnails     │
│ Features:    │    │ • Persistence    │    │                  │
│ • Partitioning│   │ • High Throughput│    │ Features:        │
│ • Replication │   │                  │    │ • CDN Integration│
│ • Durability  │   │                  │    │ • Versioning     │
│ • Scalability │   │                  │    │ • Lifecycle Mgmt │
└──────────────┘    └──────────────────┘    └──────────────────┘
```

## Data Flow Diagrams

### 1. Content Creation and Publishing Flow

```
┌────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Editor   │───►│ CMS Service │───►│ PostgreSQL  │───►│   Kafka     │
│  Creates   │    │   Validates │    │   Stores    │    │  Publishes  │
│  Content   │    │    Data     │    │    Data     │    │   Event     │
└────────────┘    └─────────────┘    └─────────────┘    └─────┬───────┘
                                                               │
                                                               ▼
┌────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Users    │◄───│ Discovery   │◄───│ PostgreSQL  │◄───│   Kafka     │
│   Search   │    │  Service    │    │  Discovery  │    │  Consumer   │
│  Content   │    │   Returns   │    │   Updates   │    │  Processes  │
└────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 2. Search and Discovery Flow

```
┌────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    User    │───►│ Discovery   │───►│    Redis    │───►│  Response   │
│   Search   │    │   Service   │    │   Cache     │    │   (Cached)  │
│   Query    │    │   Checks    │    │   Hit?      │    │             │
└────────────┘    └─────────────┘    └─────┬───────┘    └─────────────┘
                                           │ Cache Miss
                                           ▼
                  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
                  │  Response   │◄───│ PostgreSQL  │◄───│ Discovery   │
                  │  + Cache    │    │   Query     │    │   Service   │
                  │   Update    │    │  Database   │    │   Executes  │
                  └─────────────┘    └─────────────┘    └─────────────┘
```

### 3. Media Upload and Processing Flow

```
┌────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Editor   │───►│ CMS Service │───►│    AWS S3   │───►│   Kafka     │
│  Uploads   │    │  Validates  │    │   Stores    │    │  Publishes  │
│   Media    │    │    File     │    │ Original    │    │Media Event  │
└────────────┘    └─────────────┘    └─────┬───────┘    └─────┬───────┘
                                           │                  │
                  ┌─────────────┐          │                  │
                  │ Media       │          │                  │
                  │ Processing  │◄─────────┘                  │
                  │ Service     │                             │
                  └─────┬───────┘                             │
                        │                                     │
                        ▼                                     │
                  ┌─────────────┐    ┌─────────────┐          │
                  │    AWS S3   │    │ Database    │◄─────────┘
                  │ Processed   │    │  Updates    │
                  │ MP4 Files   │    │ Metadata    │
                  │ + Metadata  │    │             │
                  └─────────────┘    └─────────────┘

Media Processing Steps:
1. Save original file to S3 (archive)
2. Extract metadata from uploaded file
3. Combine with publisher input data
4. Convert to optimized MP4 format
5. Save processed version to S3
6. Update database with complete metadata
```

## Security Architecture

```
                        ┌─────────────────────────┐
                        │      Security Layer     │
                        └─────────────────────────┘
                                     │
            ┌────────────────────────┼────────────────────────┐
            │                        │                        │
            ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Authentication  │    │   Authorization  │    │ Data Validation  │
├──────────────────┤    ├──────────────────┤    ├──────────────────┤
│ • JWT Tokens     │    │ • Role-based     │    │ • Input Sanit.   │
│ • Secure Login   │    │ • Permission     │    │ • SQL Injection  │
│ • Token Refresh  │    │ • Resource Access│    │ • XSS Protection │
│ • Session Mgmt   │    │ • API Security   │    │ • File Validation│
└──────────────────┘    └──────────────────┘    └──────────────────┘
            │                        │                        │
            └────────────────────────┼────────────────────────┘
                                     │
                                     ▼
                        ┌─────────────────────────┐
                        │    Secure Transport     │
                        ├─────────────────────────┤
                        │ • HTTPS/TLS             │
                        │ • API Rate Limiting     │
                        │ • CORS Configuration    │
                        │ • Request Logging       │
                        └─────────────────────────┘
```

## Scalability Architecture

```
                    ┌─────────────────────────────────┐
                    │         Load Balancer           │
                    │     (Future Enhancement)        │
                    └─────────────┬───────────────────┘
                                  │
                    ┌─────────────┴───────────────────┐
                    │                                 │
                    ▼                                 ▼
        ┌─────────────────────┐           ┌─────────────────────┐
        │  CMS Service        │           │ Discovery Service   │
        │  Instance 1         │           │  Instance 1         │
        └─────────────────────┘           └─────────────────────┘
                    │                                 │
        ┌─────────────────────┐           ┌─────────────────────┐
        │  CMS Service        │           │ Discovery Service   │
        │  Instance 2         │           │  Instance 2         │
        └─────────────────────┘           └─────────────────────┘
                    │                                 │
                    └─────────────┬───────────────────┘
                                  │
                    ┌─────────────▼───────────────────┐
                    │      Shared Infrastructure      │
                    ├─────────────────────────────────┤
                    │ • Kafka Cluster (Partitioned)   │
                    │ • Redis Cluster (Sharded)       │
                    │ • PostgreSQL (Read Replicas)    │
                    │ • AWS S3 (CDN Distribution)     │
                    └─────────────────────────────────┘
```

This architecture documentation provides a comprehensive view of the system design, showing how all components interact to create a scalable, high-performance content management and discovery platform for Thamaniya.
