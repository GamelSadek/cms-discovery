-- Discovery Database Initialization Script
-- This script creates the optimized, denormalized tables for the Discovery microservice

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Discovery Programs table (denormalized and optimized for search)
CREATE TABLE IF NOT EXISTS discovery_programs (
    id UUID PRIMARY KEY,
    publisher_id UUID NOT NULL,
    publisher_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    category VARCHAR(100) NOT NULL,
    language VARCHAR(10) DEFAULT 'ar',
    type VARCHAR(50) DEFAULT 'podcast',
    rating DECIMAL(3,2) DEFAULT 0.0,
    view_count INTEGER DEFAULT 0,
    episode_count INTEGER DEFAULT 0,
    thumbnail_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    tags TEXT[],
    is_featured BOOLEAN DEFAULT false,
    published_at TIMESTAMP NOT NULL,
    last_updated TIMESTAMP NOT NULL,
    
    -- Search optimization fields
    search_vector tsvector,
    search_keywords TEXT[],
    
    -- Kafka synchronization fields
    kafka_version INTEGER NOT NULL DEFAULT 1,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Discovery Episodes table (denormalized and optimized for search)
CREATE TABLE IF NOT EXISTS discovery_episodes (
    id UUID PRIMARY KEY,
    program_id UUID NOT NULL,
    program_title VARCHAR(255) NOT NULL,
    program_category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    audio_url VARCHAR(500),
    video_url VARCHAR(500),
    duration INTEGER, -- Duration in seconds
    episode_number INTEGER,
    season_number INTEGER DEFAULT 1,
    publish_date TIMESTAMP NOT NULL,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    tags TEXT[],
    
    -- Search optimization fields
    search_vector tsvector,
    search_keywords TEXT[],
    
    -- Kafka synchronization fields
    kafka_version INTEGER NOT NULL DEFAULT 1,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consumer Group tracking for Kafka
CREATE TABLE IF NOT EXISTS kafka_consumer_offsets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic VARCHAR(100) NOT NULL,
    partition_num INTEGER NOT NULL,
    offset_value BIGINT NOT NULL,
    consumer_group VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(topic, partition_num, consumer_group)
);

-- Sync Statistics table for monitoring
CREATE TABLE IF NOT EXISTS sync_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    total_entities INTEGER DEFAULT 0,
    last_sync_at TIMESTAMP,
    sync_status VARCHAR(20) DEFAULT 'active' CHECK (sync_status IN ('active', 'lagging', 'failed')),
    lag_seconds INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_error_message TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create comprehensive indexes for search and performance
-- Primary search indexes
CREATE INDEX IF NOT EXISTS idx_discovery_programs_search_vector ON discovery_programs USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_discovery_episodes_search_vector ON discovery_episodes USING gin(search_vector);

-- Category and filtering indexes
CREATE INDEX IF NOT EXISTS idx_discovery_programs_category ON discovery_programs(category);
CREATE INDEX IF NOT EXISTS idx_discovery_programs_language ON discovery_programs(language);
CREATE INDEX IF NOT EXISTS idx_discovery_programs_type ON discovery_programs(type);
CREATE INDEX IF NOT EXISTS idx_discovery_programs_featured ON discovery_programs(is_featured);
CREATE INDEX IF NOT EXISTS idx_discovery_programs_rating ON discovery_programs(rating DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_programs_view_count ON discovery_programs(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_programs_published_at ON discovery_programs(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_discovery_episodes_program_id ON discovery_episodes(program_id);
CREATE INDEX IF NOT EXISTS idx_discovery_episodes_program_category ON discovery_episodes(program_category);
CREATE INDEX IF NOT EXISTS idx_discovery_episodes_publish_date ON discovery_episodes(publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_episodes_view_count ON discovery_episodes(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_episodes_episode_number ON discovery_episodes(episode_number);
CREATE INDEX IF NOT EXISTS idx_discovery_episodes_season_number ON discovery_episodes(season_number);

-- Publisher indexes
CREATE INDEX IF NOT EXISTS idx_discovery_programs_publisher_id ON discovery_programs(publisher_id);
CREATE INDEX IF NOT EXISTS idx_discovery_programs_publisher_name ON discovery_programs(publisher_name);

-- Kafka sync indexes
CREATE INDEX IF NOT EXISTS idx_discovery_programs_kafka_version ON discovery_programs(kafka_version);
CREATE INDEX IF NOT EXISTS idx_discovery_episodes_kafka_version ON discovery_episodes(kafka_version);
CREATE INDEX IF NOT EXISTS idx_discovery_programs_synced_at ON discovery_programs(synced_at);
CREATE INDEX IF NOT EXISTS idx_discovery_episodes_synced_at ON discovery_episodes(synced_at);

-- Tags search indexes
CREATE INDEX IF NOT EXISTS idx_discovery_programs_tags ON discovery_programs USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_discovery_episodes_tags ON discovery_episodes USING gin(tags);

-- Keywords search indexes
CREATE INDEX IF NOT EXISTS idx_discovery_programs_keywords ON discovery_programs USING gin(search_keywords);
CREATE INDEX IF NOT EXISTS idx_discovery_episodes_keywords ON discovery_episodes USING gin(search_keywords);

-- Text search indexes using trigrams
CREATE INDEX IF NOT EXISTS idx_discovery_programs_title_trgm ON discovery_programs USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_discovery_programs_description_trgm ON discovery_programs USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_discovery_episodes_title_trgm ON discovery_episodes USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_discovery_episodes_description_trgm ON discovery_episodes USING gin (description gin_trgm_ops);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_discovery_programs_category_featured ON discovery_programs(category, is_featured, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_programs_publisher_published ON discovery_programs(publisher_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_episodes_program_episode_num ON discovery_episodes(program_id, season_number, episode_number);

-- Consumer offset tracking indexes
CREATE INDEX IF NOT EXISTS idx_kafka_consumer_offsets_topic ON kafka_consumer_offsets(topic, consumer_group);

-- Sync statistics indexes
CREATE INDEX IF NOT EXISTS idx_sync_statistics_entity_type ON sync_statistics(entity_type);
CREATE INDEX IF NOT EXISTS idx_sync_statistics_status ON sync_statistics(sync_status);

-- Functions for search vector updates
CREATE OR REPLACE FUNCTION update_program_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('arabic', 
        COALESCE(NEW.title, '') || ' ' || 
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.publisher_name, '') || ' ' ||
        COALESCE(array_to_string(NEW.tags, ' '), '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_episode_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('arabic',
        COALESCE(NEW.title, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.program_title, '') || ' ' ||
        COALESCE(array_to_string(NEW.tags, ' '), '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic search vector updates
CREATE TRIGGER update_discovery_programs_search_vector
    BEFORE INSERT OR UPDATE ON discovery_programs
    FOR EACH ROW EXECUTE FUNCTION update_program_search_vector();

CREATE TRIGGER update_discovery_episodes_search_vector
    BEFORE INSERT OR UPDATE ON discovery_episodes
    FOR EACH ROW EXECUTE FUNCTION update_episode_search_vector();

-- Function to update sync statistics
CREATE OR REPLACE FUNCTION update_sync_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update program stats
    INSERT INTO sync_statistics (entity_type, total_entities, last_sync_at)
    VALUES ('program', (SELECT COUNT(*) FROM discovery_programs), CURRENT_TIMESTAMP)
    ON CONFLICT (entity_type) 
    DO UPDATE SET 
        total_entities = (SELECT COUNT(*) FROM discovery_programs),
        last_sync_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for program sync stats
CREATE TRIGGER update_program_sync_stats
    AFTER INSERT OR UPDATE OR DELETE ON discovery_programs
    FOR EACH STATEMENT EXECUTE FUNCTION update_sync_stats();

-- Initialize sync statistics
INSERT INTO sync_statistics (entity_type, total_entities, last_sync_at)
VALUES 
    ('program', 0, CURRENT_TIMESTAMP),
    ('episode', 0, CURRENT_TIMESTAMP)
ON CONFLICT (entity_type) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO discovery_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO discovery_user;
