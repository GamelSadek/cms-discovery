@echo off
REM Docker Development Environment Setup Script for Windows
REM This script sets up the entire development environment using Docker

echo 🚀 Setting up CMS Discovery System with Docker...

REM Stop any existing containers
echo 📦 Stopping existing containers...
docker-compose down

REM Remove old volumes (optional - uncomment if you want fresh databases)
REM echo 🗑️  Removing old volumes...
REM docker volume rm cms-discovery_cms_postgres_data cms-discovery_discovery_postgres_data cms-discovery_redis_data cms-discovery_upload_data 2>nul

REM Build and start all services
echo 🏗️  Building and starting services...
docker-compose up --build -d

REM Wait for databases to be ready
echo ⏳ Waiting for databases to be ready...
timeout /t 30 /nobreak >nul

REM Show status
echo 📊 Service Status:
docker-compose ps

echo.
echo ✅ Setup complete! Services are running:
echo    🎯 CMS Service: http://localhost:3000
echo    🔍 Discovery Service: http://localhost:3001
echo    📊 Kafka UI: http://localhost:8080
echo    💾 PostgreSQL CMS: localhost:5432
echo    💾 PostgreSQL Discovery: localhost:5433
echo    🚀 Redis Cache: localhost:6379
echo.
echo 📚 API Documentation:
echo    🎯 CMS API Docs: http://localhost:3000/api
echo    🔍 Discovery API Docs: http://localhost:3001/api
echo.
echo 🔧 To view logs:
echo    docker-compose logs -f [service-name]
echo.
echo 🛑 To stop all services:
echo    docker-compose down

pause
