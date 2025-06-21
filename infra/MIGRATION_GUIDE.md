# Migration Guide: Single Environment to Multi-Environment

This guide helps you migrate from the existing single-environment infrastructure to the new multi-environment setup.

## Current State

If you have an existing deployment with:
- GKE cluster: `promptionary-gke`
- Database: `promptionary`
- Network: `promptionary-network`

## Migration Steps

### 1. Backup Current State

```bash
# Save current terraform state
terraform state pull > terraform.state.backup.json

# Backup database (optional but recommended)
gcloud sql export sql promptionary gs://YOUR_BACKUP_BUCKET/promptionary-backup.sql \
  --database=promptionary
```

### 2. Import Existing Resources to Production Workspace

```bash
# Initialize and create workspaces
./setup-environments.sh

# Switch to production workspace
terraform workspace select prod

# Import existing resources
terraform import -var-file=environments/prod.tfvars google_container_cluster.primary promptionary-gke
terraform import -var-file=environments/prod.tfvars google_sql_database_instance.main promptionary
terraform import -var-file=environments/prod.tfvars google_compute_network.vpc_network promptionary-network
terraform import -var-file=environments/prod.tfvars google_compute_subnetwork.subnet promptionary-subnet
```

### 3. Update Resource Names

The resources will need to be renamed to include the environment suffix. You have two options:

#### Option A: Rename in GCP (Recommended for minimal downtime)

1. Use the GCP Console or gcloud to rename resources:
   - `promptionary-gke` → `promptionary-gke-prod`
   - `promptionary` → `promptionary-prod`
   - `promptionary-network` → `promptionary-network-prod`
   - `promptionary-subnet` → `promptionary-subnet-prod`

2. Update GitHub Secrets:
   - Update `DB_INSTANCE_CONNECTION_NAME` with the new database connection name

3. Apply Terraform to confirm state matches:
   ```bash
   terraform apply -var-file=environments/prod.tfvars
   ```

#### Option B: Recreate Resources (Requires downtime)

1. Destroy old resources:
   ```bash
   terraform workspace select default
   terraform destroy
   ```

2. Create new resources:
   ```bash
   terraform workspace select prod
   terraform apply -var-file=environments/prod.tfvars
   ```

### 4. Update GitHub Workflows

The GitHub workflows have already been updated to use the new cluster names. Once the migration is complete, they will automatically deploy to the correct clusters.

### 5. Create Test Environment

```bash
# Switch to test workspace
terraform workspace select test

# Create test environment
terraform apply -var-file=environments/test.tfvars
```

### 6. Update GitHub Secrets

Add the following new secrets for the test environment:
- `TEST_DB_USER`: Set to `postgres`
- `TEST_DB_PASSWORD`: Set a secure password
- `TEST_DB_NAME`: Set to `promptionary`
- `TEST_DB_INSTANCE_CONNECTION_NAME`: Will be output after terraform apply

## Verification

1. Check production deployment:
   ```bash
   gcloud container clusters get-credentials promptionary-gke-prod --zone us-central1
   kubectl get deployments
   ```

2. Test the test environment deployment:
   - Go to GitHub Actions
   - Run "Deploy to Test Environment" workflow
   - Verify the deployment completes successfully

## Rollback Plan

If issues occur:

1. Revert GitHub workflow files to use old cluster name
2. Use the backed-up state file:
   ```bash
   terraform state push terraform.state.backup.json
   ```

## Notes

- The new setup maintains backward compatibility with existing deployments
- No application code changes are required
- Database data is preserved during the migration