#!/bin/bash
# Apply memory limits to Supabase containers after supabase start
# Run this after: npx supabase start

PROJECT="roline-v0"

echo "Applying memory limits to containers..."

# Database - needs more memory
docker update --memory=512m --memory-swap=512m supabase_db_${PROJECT} 2>/dev/null

# Analytics - moderate memory
docker update --memory=256m --memory-swap=256m supabase_analytics_${PROJECT} 2>/dev/null

# Medium services
docker update --memory=128m --memory-swap=128m \
  supabase_pg_meta_${PROJECT} \
  supabase_studio_${PROJECT} \
  supabase_storage_${PROJECT} \
  supabase_realtime_${PROJECT} \
  supabase_auth_${PROJECT} 2>/dev/null

# Light services
docker update --memory=64m --memory-swap=64m \
  supabase_rest_${PROJECT} \
  supabase_kong_${PROJECT} \
  supabase_vector_${PROJECT} \
  supabase_inbucket_${PROJECT} 2>/dev/null

# CTK services (if running)
docker update --memory=512m --memory-swap=512m ctk_v4_neo4j 2>/dev/null
docker update --memory=128m --memory-swap=128m ctk_v4_qdrant 2>/dev/null

echo "Memory limits applied. Total max: ~2.2GB"
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}" 2>/dev/null | grep -E "supabase|ctk"
