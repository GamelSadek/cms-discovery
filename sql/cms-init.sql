-- CMS Database Initialization Script
-- This script creates the necessary tables and configurations for the CMS microservice

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Publishers table
CREATE TABLE IF NOT EXISTS publishers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    website VARCHAR(255),
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Programs table
CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publisher_id UUID NOT NULL REFERENCES publishers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    category VARCHAR(100) NOT NULL,
    language VARCHAR(10) DEFAULT 'ar',
    type VARCHAR(50) DEFAULT 'podcast',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    rating DECIMAL(3,2) DEFAULT 0.0,
    view_count INTEGER DEFAULT 0,
    thumbnail_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    tags TEXT[],
    is_featured BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1
);

-- Episodes table
CREATE TABLE IF NOT EXISTS episodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    audio_url VARCHAR(500),
    video_url VARCHAR(500),
    duration INTEGER, -- Duration in seconds
    episode_number INTEGER,
    season_number INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    publish_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1
);

-- Media files table
CREATE TABLE IF NOT EXISTS media_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- image, audio, video, document
    entity_type VARCHAR(50), -- program, episode, publisher
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Kafka Events tracking table
CREATE TABLE IF NOT EXISTS kafka_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    topic_name VARCHAR(100) NOT NULL,
    partition_key VARCHAR(255) NOT NULL,
    event_data JSONB NOT NULL,
    kafka_offset BIGINT,
    sent_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer')),
    publisher_id UUID REFERENCES publishers(id),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_programs_publisher_id ON programs(publisher_id);
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);
CREATE INDEX IF NOT EXISTS idx_programs_category ON programs(category);
CREATE INDEX IF NOT EXISTS idx_programs_published_at ON programs(published_at);
CREATE INDEX IF NOT EXISTS idx_programs_featured ON programs(is_featured);

CREATE INDEX IF NOT EXISTS idx_episodes_program_id ON episodes(program_id);
CREATE INDEX IF NOT EXISTS idx_episodes_status ON episodes(status);
CREATE INDEX IF NOT EXISTS idx_episodes_publish_date ON episodes(publish_date);
CREATE INDEX IF NOT EXISTS idx_episodes_episode_number ON episodes(episode_number);

CREATE INDEX IF NOT EXISTS idx_media_files_entity ON media_files(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_media_files_type ON media_files(file_type);

CREATE INDEX IF NOT EXISTS idx_kafka_events_entity ON kafka_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_kafka_events_status ON kafka_events(status);
CREATE INDEX IF NOT EXISTS idx_kafka_events_created_at ON kafka_events(created_at);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_publisher_id ON users(publisher_id);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_programs_title_trgm ON programs USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_programs_description_trgm ON programs USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_episodes_title_trgm ON episodes USING gin (title gin_trgm_ops);

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_publishers_updated_at BEFORE UPDATE ON publishers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_episodes_updated_at BEFORE UPDATE ON episodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, role) 
VALUES (
    'admin@cms.local', 
    '$2b$10$rZvhEpCbvpOLvv6lQ8HxP.K0SjXjF4mP6rHwJYLQa6DgOFwpx8fIa', 
    'المدير',
    'العام',
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample publisher
INSERT INTO publishers (id, name, description, email, phone, website, is_active)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'ناشر تجريبي',
    'ناشر تجريبي للاختبار والتطوير',
    'publisher@test.com',
    '+966501234567',
    'https://test-publisher.com',
    true
) ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cms_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cms_user;
