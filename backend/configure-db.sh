#!/bin/bash

# Script to configure AlloyDB connection for Cloud Run service
# Usage: ./configure-db.sh PROJECT_ID ALLOYDB_IP

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ -z "$1" ] || [ -z "$2" ]; then
    echo -e "${RED}Error: Missing required arguments${NC}"
    echo ""
    echo "Usage: ./configure-db.sh PROJECT_ID ALLOYDB_IP"
    echo ""
    echo "Example:"
    echo "  ./configure-db.sh my-project 10.0.0.5"
    echo ""
    echo "To get your AlloyDB IP:"
    echo "  gcloud alloydb instances describe INSTANCE_NAME \\"
    echo "      --cluster=CLUSTER_NAME \\"
    echo "      --region=us-central1 \\"
    echo "      --format='value(ipAddress)'"
    exit 1
fi

PROJECT_ID=$1
ALLOYDB_IP=$2
REGION="us-central1"
SERVICE_NAME="database-querying-backend"

echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}Configuring AlloyDB Connection${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""
echo "Project ID: $PROJECT_ID"
echo "AlloyDB IP: $ALLOYDB_IP"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo ""

# Set project
gcloud config set project $PROJECT_ID

# Check if service exists
echo -e "${YELLOW}Checking if service exists...${NC}"
if ! gcloud run services describe $SERVICE_NAME --region=$REGION &>/dev/null; then
    echo -e "${RED}Error: Service '$SERVICE_NAME' not found in region $REGION${NC}"
    echo "Please deploy the service first using: ./deploy.sh $PROJECT_ID"
    exit 1
fi
echo -e "${GREEN}✓ Service found${NC}"
echo ""

# Configure environment variables
echo -e "${YELLOW}Configuring environment variables...${NC}"
gcloud run services update $SERVICE_NAME \
    --region=$REGION \
    --set-env-vars="DB_HOST=$ALLOYDB_IP,DB_USER=alloydb,DB_PORT=5432,DB_NAME=querydb,NODE_ENV=production"

echo -e "${GREEN}✓ Environment variables configured${NC}"
echo ""

# Ask about password configuration
echo -e "${YELLOW}Database Password Configuration${NC}"
echo ""
echo "You have two options for setting the database password:"
echo ""
echo "1. Environment Variable (less secure, easier for testing)"
echo "2. Secret Manager (recommended for production)"
echo ""
read -p "Choose option (1 or 2): " password_option

if [ "$password_option" = "1" ]; then
    read -sp "Enter database password: " db_password
    echo ""
    
    gcloud run services update $SERVICE_NAME \
        --region=$REGION \
        --set-env-vars="DB_PASSWORD=$db_password"
    
    echo -e "${GREEN}✓ Password set as environment variable${NC}"
    
elif [ "$password_option" = "2" ]; then
    echo ""
    echo "Setting up Secret Manager..."
    
    # Enable Secret Manager API
    gcloud services enable secretmanager.googleapis.com
    
    # Check if secret already exists
    if gcloud secrets describe db-password &>/dev/null; then
        echo "Secret 'db-password' already exists"
        read -p "Do you want to update it? (y/n): " update_secret
        
        if [ "$update_secret" = "y" ]; then
            read -sp "Enter database password: " db_password
            echo ""
            echo -n "$db_password" | gcloud secrets versions add db-password --data-file=-
            echo -e "${GREEN}✓ Secret updated${NC}"
        fi
    else
        read -sp "Enter database password: " db_password
        echo ""
        echo -n "$db_password" | gcloud secrets create db-password --data-file=-
        echo -e "${GREEN}✓ Secret created${NC}"
    fi
    
    # Update Cloud Run to use the secret
    gcloud run services update $SERVICE_NAME \
        --region=$REGION \
        --set-secrets="DB_PASSWORD=db-password:latest"
    
    echo -e "${GREEN}✓ Cloud Run configured to use secret${NC}"
else
    echo -e "${RED}Invalid option. Skipping password configuration.${NC}"
fi

echo ""

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --region=$REGION \
    --format='value(status.url)')

echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}Configuration Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""
echo "Service URL: $SERVICE_URL"
echo ""
echo "Current environment variables:"
gcloud run services describe $SERVICE_NAME \
    --region=$REGION \
    --format="table(spec.template.spec.containers[0].env[].name,spec.template.spec.containers[0].env[].value)"
echo ""
echo "Test the connection:"
echo "  curl $SERVICE_URL/api/health"
echo "  curl $SERVICE_URL/api/databases"
echo ""
