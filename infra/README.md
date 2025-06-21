# Promptionary Infrastructure

This directory contains the Terraform configuration for deploying Promptionary to Google Cloud Platform (GCP).

## Architecture

The infrastructure includes:

- **VPC Network**: Custom VPC with private subnets for GKE
- **GKE Cluster**: Managed Kubernetes cluster with autoscaling
- **Cloud SQL**: PostgreSQL database with private IP, backups, and high availability
- **Cloud NAT**: For outbound internet access from private nodes
- **Secret Manager**: For secure storage of sensitive data

## Prerequisites

1. GCP Project with billing enabled
2. Terraform >= 1.3.0
3. `gcloud` CLI installed and configured
4. Required GCP APIs enabled (handled by Terraform)

## Configuration

### Environment Variables

Create a `terraform.tfvars` file:

```hcl
project_id    = "your-gcp-project-id"
environment   = "production"  # or "development", "staging"
region        = "us-central1"
zone          = "us-central1-a"
```

### Key Features

1. **Security Best Practices**
   - Private GKE nodes with Cloud NAT for outbound access
   - Cloud SQL with private IP only
   - Workload Identity enabled
   - Binary Authorization (production only)
   - Shielded GKE nodes
   - SSL required for database connections

2. **High Availability**
   - Regional Cloud SQL configuration (production)
   - Multi-zone GKE cluster with autoscaling
   - Automated backups with point-in-time recovery

3. **Cost Optimization**
   - Preemptible nodes for non-production environments
   - Autoscaling based on load
   - Appropriate machine types for workload

## Deployment

1. Initialize Terraform:
   ```bash
   terraform init
   ```

2. Review the plan:
   ```bash
   terraform plan
   ```

3. Apply the configuration:
   ```bash
   terraform apply
   ```

## Outputs

After deployment, Terraform will output:

- `gke_cluster_name`: Name of the GKE cluster
- `gke_cluster_endpoint`: Cluster API endpoint
- `database_connection_name`: Cloud SQL connection string
- `database_instance_name`: Cloud SQL instance name
- `db_password_secret_id`: Secret Manager ID for database password

## Connecting to Resources

### GKE Cluster
```bash
gcloud container clusters get-credentials $(terraform output -raw gke_cluster_name) \
  --zone $(terraform output -raw zone)
```

### Database Password
```bash
gcloud secrets versions access latest \
  --secret=$(terraform output -raw db_password_secret_id)
```

## Maintenance

### Database Backups
- Automated daily backups at 2 AM
- 30-day retention for production
- Point-in-time recovery enabled

### GKE Updates
- Nodes auto-upgrade during maintenance window
- Stable release channel for production
- Regular channel for development

### Monitoring
- Cloud SQL Query Insights enabled
- GKE monitoring and logging enabled
- Network flow logs for debugging

## Cost Estimation

Monthly costs (approximate):
- GKE Cluster: $75-150 (depends on node usage)
- Cloud SQL: $50-100 (db-g1-small with backups)
- Network: $10-30 (egress traffic)
- Total: ~$135-280/month

## Cleanup

To destroy all resources:
```bash
terraform destroy
```

⚠️ **Warning**: This will delete all resources including the database. Ensure you have backups before proceeding. 