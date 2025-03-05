#!/bin/bash
# Fleet DMS Backend - Google Cloud Run Deployment Script

# Exit on error
set -e

# Display usage information
function show_usage {
  echo "Usage: ./deploy.sh [OPTIONS]"
  echo "Deploy Fleet DMS Backend to Google Cloud Run"
  echo ""
  echo "Options:"
  echo "  --project=PROJECT_ID      Google Cloud Project ID (required)"
  echo "  --region=REGION           Google Cloud Region (default: us-central1)"
  echo "  --service=SERVICE_NAME    Cloud Run service name (default: fleet-dms-backend)"
  echo "  --db-url=DATABASE_URL     Database connection URL (required)"
  echo "  --secret-key=SECRET_KEY   JWT secret key (required)"
  echo "  --samsara-key=API_KEY     Samsara API key (optional)"
  echo "  --cors=ORIGINS            CORS origins, comma-separated (default: *)"
  echo "  --help                    Display this help message"
  echo ""
  echo "Example:"
  echo "  ./deploy.sh --project=my-fleet-project --db-url=postgresql://user:pass@host/db --secret-key=mysecretkey"
}

# Default values
REGION="us-central1"
SERVICE_NAME="fleet-dms-backend"
CORS_ORIGINS="*"

# Parse arguments
for arg in "$@"; do
  case $arg in
    --project=*)
      PROJECT_ID="${arg#*=}"
      ;;
    --region=*)
      REGION="${arg#*=}"
      ;;
    --service=*)
      SERVICE_NAME="${arg#*=}"
      ;;
    --db-url=*)
      DATABASE_URL="${arg#*=}"
      ;;
    --secret-key=*)
      SECRET_KEY="${arg#*=}"
      ;;
    --samsara-key=*)
      SAMSARA_API_KEY="${arg#*=}"
      ;;
    --cors=*)
      CORS_ORIGINS="${arg#*=}"
      ;;
    --help)
      show_usage
      exit 0
      ;;
    *)
      echo "Unknown option: $arg"
      show_usage
      exit 1
      ;;
  esac
done

# Check required arguments
if [ -z "$PROJECT_ID" ] || [ -z "$DATABASE_URL" ] || [ -z "$SECRET_KEY" ]; then
  echo "Error: Missing required arguments"
  show_usage
  exit 1
fi

echo "Deploying Fleet DMS Backend to Google Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"

# Build the Docker image
echo "Building Docker image..."
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"
docker build -t $IMAGE_NAME .

# Push to Google Container Registry
echo "Pushing image to Container Registry..."
docker push $IMAGE_NAME

# Prepare environment variables
ENV_VARS="DATABASE_URL=$DATABASE_URL,SECRET_KEY=$SECRET_KEY,CORS_ORIGINS=$CORS_ORIGINS"
if [ ! -z "$SAMSARA_API_KEY" ]; then
  ENV_VARS="$ENV_VARS,SAMSARA_API_KEY=$SAMSARA_API_KEY"
fi

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars="$ENV_VARS" \
  --project $PROJECT_ID

echo "Deployment completed successfully!"
echo "You can access your service at the URL provided above."
