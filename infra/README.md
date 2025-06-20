# Infrastructure as Code for Promptionary

This directory contains Terraform configuration to provision Google Kubernetes Engine (GKE), Cloud SQL (PostgreSQL), and required networking for Promptionary on Google Cloud Platform.

## Prerequisites
- [Terraform](https://www.terraform.io/) v1.3+
- Google Cloud SDK (`gcloud`)
- A Google Cloud project with billing enabled

## Setup Steps
1. Authenticate with Google Cloud:
   ```bash
   gcloud auth application-default login
   gcloud config set project <YOUR_PROJECT_ID>
   ```
2. Initialize Terraform:
   ```bash
   cd infra
   terraform init
   ```
3. Review and apply the configuration:
   ```bash
   terraform plan
   terraform apply
   ```

This will provision:
- A GKE cluster for running backend and frontend containers
- A Cloud SQL PostgreSQL instance
- Networking (VPC, subnets, firewall rules)

See the individual `.tf` files for resource details. 