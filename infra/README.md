# Promptionary Infrastructure

This directory contains Terraform configurations for deploying the Promptionary infrastructure on Google Cloud Platform.

## Architecture

The infrastructure supports multiple environments:
- **Production** (`prod`): Main environment for users
- **Test** (`test`): Testing environment for deploying any branch

Each environment includes:
- GKE cluster for running containers
- Cloud SQL PostgreSQL database
- VPC network with subnet
- Load balancers for external access

## Prerequisites

1. Google Cloud SDK installed
2. Terraform installed (>= 1.3.0)
3. GCP project with billing enabled
4. Service account with appropriate permissions

## Terraform Workspaces

We use Terraform workspaces to manage multiple environments:

```bash
# Create workspaces
terraform workspace new prod
terraform workspace new test

# Switch between workspaces
terraform workspace select prod
terraform workspace select test
```

## Deployment

### Initial Setup

1. Initialize Terraform:
```bash
terraform init
```

2. Create workspaces:
```bash
terraform workspace new prod
terraform workspace new test
```

### Deploy Production Environment

```bash
terraform workspace select prod
terraform plan -var-file=environments/prod.tfvars
terraform apply -var-file=environments/prod.tfvars
```

### Deploy Test Environment

```bash
terraform workspace select test
terraform plan -var-file=environments/test.tfvars
terraform apply -var-file=environments/test.tfvars
```

## Required Variables

- `project_id`: Your GCP project ID
- `db_password`: Password for the PostgreSQL database

## GitHub Secrets Required

For the GitHub Actions workflows to work, you need to set up the following secrets:

### For Production:
- `GCP_PROJECT_ID`: Your GCP project ID
- `GCP_SA_KEY`: Service account key JSON
- `DB_USER`: Database username (default: postgres)
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name (default: promptionary)
- `DB_INSTANCE_CONNECTION_NAME`: Cloud SQL instance connection name
- `OPENAI_API_KEY`: OpenAI API key

### For Test Environment:
- `TEST_DB_USER`: Test database username
- `TEST_DB_PASSWORD`: Test database password
- `TEST_DB_NAME`: Test database name
- `TEST_DB_INSTANCE_CONNECTION_NAME`: Test Cloud SQL instance connection name

## Resource Naming Convention

Resources are named with the environment suffix:
- Production: `promptionary-{resource}-prod`
- Test: `promptionary-{resource}-test`

## Outputs

After deployment, Terraform will output:
- `db_connection_name`: Cloud SQL connection name
- `db_name`: Database name
- `db_user`: Database username
- `db_instance_name`: Cloud SQL instance name
- `gke_cluster_name`: GKE cluster name 