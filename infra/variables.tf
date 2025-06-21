variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "project_name" {
  description = "The project name used for resource naming"
  type        = string
  default     = "promptionary"
}

variable "environment" {
  description = "Environment name (prod or test)"
  type        = string
  default     = "prod"
  
  validation {
    condition     = contains(["prod", "test"], var.environment)
    error_message = "Environment must be either 'prod' or 'test'."
  }
}

variable "region" {
  description = "The GCP region to deploy resources in"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "The GCP zone to deploy resources in"
  type        = string
  default     = "us-central1-a"
}

# Database variables
variable "db_name" {
  description = "The name of the Cloud SQL database"
  type        = string
  default     = "promptionary"
}

variable "db_tier" {
  description = "The machine type for the Cloud SQL instance"
  type        = string
  default     = "db-g1-small"
}

variable "db_disk_size" {
  description = "The disk size for the Cloud SQL instance in GB"
  type        = number
  default     = 20
}

# GKE variables
variable "gke_cluster_name" {
  description = "The name of the GKE cluster"
  type        = string
  default     = "promptionary-gke"
}

variable "gke_node_count" {
  description = "Number of nodes in the GKE cluster"
  type        = number
  default     = 2
}

variable "gke_node_machine_type" {
  description = "Machine type for GKE nodes"
  type        = string
  default     = "e2-medium"
}

# Network variables
variable "network_name" {
  description = "The name of the VPC network"
  type        = string
  default     = "promptionary-vpc"
}

variable "subnet_cidr" {
  description = "CIDR range for the subnet"
  type        = string
  default     = "10.0.0.0/24"
}

variable "db_user" {
  description = "The Cloud SQL database user"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "The Cloud SQL database password"
  type        = string
  sensitive   = true
} 