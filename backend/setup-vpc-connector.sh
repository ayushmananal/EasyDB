#!/bin/bash

# VPC Connector Setup Script for AlloyDB Access
# This script creates a VPC connector to allow Cloud Run to access AlloyDB

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if project ID is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Project ID is required${NC}"
    echo "Usage: ./setup-vpc-connector.sh YOUR_PROJECT_ID [REGION]"
    exit 1
fi

PROJECT_ID=$1
REGION=${2:-us-central1}
CONNECTOR_NAME="alloydb-connector"
NETWORK="default"
IP_RANGE="10.8.0.0/28"

echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}Setting up VPC Connector for AlloyDB Access${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Connector Name: $CONNECTOR_NAME"
echo "Network: $NETWORK"
echo "IP Range: $IP_RANGE"
echo ""

# Set the project
echo -e "${YELLOW}[1/5] Setting project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}[2/5] Enabling required APIs...${NC}"
gcloud services enable vpcaccess.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable servicenetworking.googleapis.com

echo -e "${GREEN}✓ APIs enabled${NC}"
echo ""

# Check if connector already exists
echo -e "${YELLOW}[3/5] Checking for existing VPC connector...${NC}"
if gcloud compute networks vpc-access connectors describe $CONNECTOR_NAME \
    --region=$REGION 2>/dev/null; then
    echo -e "${GREEN}✓ VPC connector '$CONNECTOR_NAME' already exists${NC}"
    CONNECTOR_EXISTS=true
else
    echo -e "${BLUE}Creating new VPC connector...${NC}"
    CONNECTOR_EXISTS=false
fi
echo ""

# Create VPC connector if it doesn't exist
if [ "$CONNECTOR_EXISTS" = false ]; then
    echo -e "${YELLOW}[4/5] Creating VPC connector...${NC}"
    echo "This may take 2-3 minutes..."
    
    gcloud compute networks vpc-access connectors create $CONNECTOR_NAME \
        --region=$REGION \
        --network=$NETWORK \
        --range=$IP_RANGE \
        --min-instances=2 \
        --max-instances=10 \
        --machine-type=e2-micro
    
    echo -e "${GREEN}✓ VPC connector created successfully${NC}"
else
    echo -e "${YELLOW}[4/5] Skipping creation (connector exists)${NC}"
fi
echo ""

# Verify connector status
echo -e "${YELLOW}[5/5] Verifying connector status...${NC}"
CONNECTOR_STATE=$(gcloud compute networks vpc-access connectors describe $CONNECTOR_NAME \
    --region=$REGION \
    --format="value(state)")

echo "Connector state: $CONNECTOR_STATE"

if [ "$CONNECTOR_STATE" = "READY" ]; then
    echo -e "${GREEN}✓ VPC connector is ready!${NC}"
else
    echo -e "${YELLOW}⚠ Connector state: $CONNECTOR_STATE (may still be initializing)${NC}"
fi
echo ""

# Display connector details
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}VPC Connector Details:${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
gcloud compute networks vpc-access connectors describe $CONNECTOR_NAME \
    --region=$REGION \
    --format="table(name,network,ipCidrRange,state)"
echo ""

# Instructions for Cloud Run deployment
echo -e "${GREEN}Next Steps:${NC}"
echo ""
echo -e "${YELLOW}1. Update your Cloud Run service to use this connector:${NC}"
echo ""
echo "   gcloud run services update database-querying-backend \\"
echo "       --vpc-connector=$CONNECTOR_NAME \\"
echo "       --region=$REGION"
echo ""
echo -e "${YELLOW}2. Or include it in your deploy.sh script:${NC}"
echo ""
echo "   --vpc-connector $CONNECTOR_NAME"
echo ""
echo -e "${YELLOW}3. Make sure your AlloyDB cluster is in the same VPC network ($NETWORK)${NC}"
echo ""
echo -e "${GREEN}Setup complete!${NC}"
