#!/bin/bash
set -e

cd "$(dirname "$0")/infra"

echo "Initializing Terraform..."
terraform init

echo "Planning Terraform changes..."
terraform plan

echo "Do you want to apply these changes? (type 'yes' to continue)"
read confirm
if [ "$confirm" = "yes" ]; then
  terraform apply
else
  echo "Aborted. No changes applied."
fi 