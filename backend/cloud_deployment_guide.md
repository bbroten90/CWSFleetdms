# Fleet DMS - Google Cloud Deployment Guide

This guide provides step-by-step instructions to deploy the Fleet DMS backend to Google Cloud Run.

## Prerequisites

1. Google Cloud Platform account
2. Google Cloud SDK installed and initialized
3. Docker installed locally (optional if using Cloud Build)
4. PostgreSQL database instance (Cloud SQL or other)

## Setup

### 1. Environment Setup

Create a `.env` file using the `.env.example` template:

```bash
# Copy the example and customize it
cp .env.example .env
```

At minimum, set these required variables:
- `DATABASE_URL`: Your PostgreSQL connection string
- `SECRET_KEY`: A secure random string (min 32 characters)

### 2. Build and Deploy 

#### Option 1: Local Docker Build and Push

```bash
# Build the Docker image
docker build -t gcr.io/YOUR-PROJECT-ID/fleet-dms-backend:latest .

# Push to Google Container Registry
docker push gcr.io/YOUR-PROJECT-ID/fleet-dms-backend:latest

# Deploy to Cloud Run
gcloud run deploy fleet-dms-backend \
  --image gcr.io/YOUR-PROJECT-ID/fleet-dms-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="SECRET_KEY=your-secret-key,DATABASE_URL=your-database-url"
```

#### Option 2: Build and Deploy with Cloud Build

```bash
# Deploy directly from source
gcloud run deploy fleet-dms-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="SECRET_KEY=your-secret-key,DATABASE_URL=your-database-url"
```

### 3. Set Up Database

Ensure your PostgreSQL database is:
1. Accessible from Cloud Run 
2. Has the proper schema

If using Cloud SQL:
```bash
# Connect to Cloud SQL Proxy (for local development)
cloud_sql_proxy -instances=YOUR-INSTANCE-CONNECTION-NAME=tcp:5432
```

## Environment Variables for Cloud Run

Configure these in the Cloud Run service settings:

| Variable | Description | Required |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SECRET_KEY` | JWT secret key | Yes |
| `SAMSARA_API_KEY` | Samsara API key | No |
| `CORS_ORIGINS` | Comma-separated list of allowed origins | No |

## Database Migration

When deploying for the first time or after schema changes:

1. Connect to your database:
```bash
psql "your-connection-string"
```

2. Run the SQL schema script:
```sql
\i backend/database/dms-database-schema.sql
```

## Health Checks

The API provides health check endpoints for Cloud Run:

- `/health` - Basic health check
- `/readiness` - Checks database connectivity

Configure these in your Cloud Run service settings.

## Security Considerations

1. Use a strong, unique `SECRET_KEY` for each environment
2. Restrict CORS origins to specific domains in production
3. Set up proper IAM roles for Cloud Run service
4. Use Cloud SQL Auth Proxy for secure database connections

## Troubleshooting

- Check Cloud Run logs for application errors
- Verify environment variables are correctly set
- Ensure database connection is properly configured
- Test health check endpoints for availability
