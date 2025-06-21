#!/bin/bash

# Setup script for Promptionary Terraform environments

set -e

echo "🚀 Setting up Promptionary Terraform environments..."

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed. Please install Terraform first."
    exit 1
fi

# Initialize Terraform
echo "📦 Initializing Terraform..."
terraform init

# Create workspaces if they don't exist
echo "🏗️  Creating Terraform workspaces..."

# Check if prod workspace exists
if ! terraform workspace list | grep -q "prod"; then
    echo "Creating 'prod' workspace..."
    terraform workspace new prod
else
    echo "Workspace 'prod' already exists"
fi

# Check if test workspace exists
if ! terraform workspace list | grep -q "test"; then
    echo "Creating 'test' workspace..."
    terraform workspace new test
else
    echo "Workspace 'test' already exists"
fi

# Switch back to default workspace
terraform workspace select default

echo "✅ Terraform workspaces setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure your terraform backend in backend.tf"
echo "2. Set up required variables in terraform.tfvars"
echo "3. Deploy production: terraform workspace select prod && terraform apply -var-file=environments/prod.tfvars"
echo "4. Deploy test: terraform workspace select test && terraform apply -var-file=environments/test.tfvars"