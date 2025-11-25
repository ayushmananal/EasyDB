#!/bin/bash

# Quick deployment script for Google Cloud Run
# Usage: ./deploy.sh [PROJECT_ID] [--with-vpc]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if project ID is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Project ID is required${NC}"
    echo "Usage: ./deploy.sh YOUR_PROJECT_ID"
    exit 1
fi

PROJECT_ID=$1
REGION="asia-south1"
SERVICE_NAME="database-querying-backend"
VPC_CONNECTOR="alloydb-connector"
USE_VPC=false

# Check for --with-vpc flag
if [ "$2" = "--with-vpc" ]; then
    USE_VPC=true
fi

echo -e "${GREEN}Starting deployment to Cloud Run...${NC}"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Set the project
echo -e "${YELLOW}Setting project...${NC}"
gcloud config set project $PROJECT_ID

# Build and submit to Cloud Build
echo -e "${YELLOW}Building container image...${NC}"
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

# Deploy to Cloud Run
echo -e "${YELLOW}Deploying to Cloud Run...${NC}"
if [ "$USE_VPC" = true ]; then
    echo "Using VPC connector: $VPC_CONNECTOR"
    gcloud run deploy $SERVICE_NAME \
        --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --vpc-connector $VPC_CONNECTOR \
        --max-instances 10 \
        --memory 512Mi \
        --cpu 1
else
    echo "Deploying without VPC connector"
    gcloud run deploy $SERVICE_NAME \
        --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --max-instances 10 \
        --memory 512Mi \
        --cpu 1
fi

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --region $REGION \
    --format 'value(status.url)')

echo ""
echo -e "${GREEN}Deployment complete!${NC}"
echo -e "Service URL: ${GREEN}$SERVICE_URL${NC}"
echo ""
echo "Test the deployment:"
echo "  curl $SERVICE_URL/api/health"
echo ""
if [ "$USE_VPC" = false ]; then
    echo -e "${YELLOW}Note: Deployed without VPC connector${NC}"
    echo "To deploy with AlloyDB access, run:"
    echo "  ./setup-vpc-connector.sh $PROJECT_ID"
    echo "  ./deploy.sh $PROJECT_ID --with-vpc"
    echo ""
fi
echo -e "${YELLOW}Remember to configure:${NC}"
echo "  1. Environment variables (DB_HOST, DB_USER, etc.)"
echo "  2. Secrets for sensitive data"
echo "  3. AlloyDB private IP address"
