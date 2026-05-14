# Production Deployment Guide

## Architecture Overview

### Local Development
```
docker-compose.yml
├── Backend Service (FastAPI)
└── PostgreSQL Service (local database)
```
- **Command**: `docker-compose up`
- Database included for convenience
- Code mounted as volume for hot-reload

### Production (AWS ECS + Aurora/RDS)
```
ECR (Docker Image)
    ↓
ECS Task Definition
    ↓
ECS Service/Fargate
    ↓
AWS Aurora/RDS PostgreSQL (external)
```
- **Only backend image** in ECR
- Database managed by AWS Aurora or RDS
- Scalable, managed infrastructure

---

## Step 1: Build & Push Backend to ECR

### Set up AWS credentials
```bash
aws configure
# Enter your AWS Access Key ID and Secret Access Key
```

### Create ECR repository
```bash
aws ecr create-repository --repository-name axiora-backend --region ap-south-1
```

### Build and push Docker image
```bash
# Build using production Dockerfile
docker build -f backend/Dockerfile.prod -t axiora-backend:latest ./backend

# Tag for ECR
docker tag axiora-backend:latest \
  217757579310.dkr.ecr.ap-south-1.amazonaws.com/axiora-backend:latest

# Login to ECR
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin \
  217757579310.dkr.ecr.ap-south-1.amazonaws.com

# Push to ECR
docker push 217757579310.dkr.ecr.ap-south-1.amazonaws.com/axiora-backend:latest
```

---

## Step 2: Set up Aurora/RDS Database

### Create Database Instance
1. Go to **RDS → Create database**
2. Choose **Aurora (PostgreSQL Compatibility)** or **RDS PostgreSQL**
3. Configure instance class, storage, and credentials
4. Note the **Endpoint** and **Port** (default 5432)

### Run migrations
```bash
# Connect to Aurora/RDS and run Alembic migrations
DATABASE_URL="postgresql://user:pass@endpoint:5432/dbname" alembic upgrade head
```

---

## Step 3: Create ECS Task Definition

### JSON Task Definition (`ecs-task-def.json`)
See `backend/ecs-task-def.json` for the full configuration.

### Store secrets in AWS SSM Parameter Store
```bash
# Store DATABASE_URL
aws ssm put-parameter \
  --name "/axiorapulse/production/DATABASE_URL" \
  --value "postgresql+psycopg2://postgres:PASSWORD@ENDPOINT:5432/postgres" \
  --type "SecureString"

# Store SECRET_KEY
aws ssm put-parameter \
  --name "/axiorapulse/production/SECRET_KEY" \
  --value "your-super-secret-production-key" \
  --type "SecureString"
```

### Register task definition
```bash
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition.json
```

---

## Step 4: Create ECS Cluster & Service

### Create Fargate cluster
```bash
aws ecs create-cluster --cluster-name axiora-prod
```

### Create ECS service
```bash
aws ecs create-service \
  --cluster axiora-prod \
  --service-name axiora-backend-service \
  --task-definition axiora-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=backend,containerPort=8000
```

---

## Step 5: Deploy with CI/CD (GitHub Actions)

### `.github/workflows/deploy-prod.yml`
```yaml
name: Deploy to ECS

on:
  push:
    branches:
      - main

env:
  AWS_REGION: ap-south-1
  ECR_REPOSITORY: axiora-backend

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Login to ECR
        run: |
          aws ecr get-login-password --region ${{ env.AWS_REGION }} | \
          docker login --username AWS --password-stdin \
          ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.${{ env.AWS_REGION }}.amazonaws.com
      
      - name: Build and push Docker image
        run: |
          docker build -f backend/Dockerfile.prod -t ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.${{ env.AWS_REGION }}.amazonaws.com/${{ env.ECR_REPOSITORY }}:latest ./backend
          docker push ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.${{ env.AWS_REGION }}.amazonaws.com/${{ env.ECR_REPOSITORY }}:latest
      
      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster axiora-prod \
            --service axiora-backend-service \
            --force-new-deployment
```

---

## Development Workflow

### Local: Run with local database
```bash
# Start both backend and database
docker-compose up

# Backend available at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### Production: Managed by ECS
- Code push to `main` branch
- GitHub Actions builds image
- Image pushed to ECR
- ECS automatically deploys
- Connects to AWS Aurora/RDS database

---

## Key Differences

| Aspect | Local | Production |
|--------|-------|-----------|
| **Database** | PostgreSQL in docker-compose | AWS Aurora/RDS (external) |
| **Image** | Dockerfile (dev friendly) | Dockerfile.prod (optimized) |
| **Environment** | .env.local | AWS SSM Parameter Store |
| **Deployment** | `docker-compose up` | ECS Service |
| **Scaling** | Manual | Auto-scaling via ECS |
| **Monitoring** | Local logs | CloudWatch logs |

---

## Troubleshooting

### Backend can't connect to Database
- Check DATABASE_URL in SSM Parameter Store
- Verify security group allows outbound/inbound on port 5432
- Check if database is in a public or private subnet

### ECS task keeps failing
- Check CloudWatch logs: `/ecs/pulse-backend`
- Verify secrets are accessible by task role (check IAM policy)
- Check health check endpoint at `/health`

### Database migration fails
- Run migrations before deploying: `alembic upgrade head`
- Check Aurora/RDS has correct schema
- Verify DATABASE_URL permissions
