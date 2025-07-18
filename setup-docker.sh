#!/bin/bash

# Docker Development Environment Setup Script
# This script sets up the entire development environment using Docker

echo "🚀 Setting up CMS Discovery System with Docker..."

# Stop any existing containers
echo "📦 Stopping existing containers..."
docker-compose down

# Remove old volumes (optional - uncomment if you want fresh databases)
# echo "🗑️  Removing old volumes..."
# docker volume rm cms-discovery_cms_postgres_data cms-discovery_discovery_postgres_data cms-discovery_redis_data cms-discovery_upload_data 2>/dev/null || true

# Build and start all services
echo "🏗️  Building and starting services..."
docker-compose up --build -d

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
sleep 30

# Show status
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "✅ Setup complete! Services are running:"
echo "   🎯 CMS Service: http://localhost:3000"
echo "   🔍 Discovery Service: http://localhost:3001"
echo "   📊 Kafka UI: http://localhost:8080"
echo "   💾 PostgreSQL CMS: localhost:5432"
echo "   💾 PostgreSQL Discovery: localhost:5433"
echo "   🚀 Redis Cache: localhost:6379"
echo ""
echo "📚 API Documentation:"
echo "   🎯 CMS API Docs: http://localhost:3000/api"
echo "   🔍 Discovery API Docs: http://localhost:3001/api"
echo ""
echo "🔧 To view logs:"
echo "   docker-compose logs -f [service-name]"
echo ""
echo "🛑 To stop all services:"
echo "   docker-compose down"
