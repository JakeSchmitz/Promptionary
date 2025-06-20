variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region to deploy resources in"
  type        = string
  default     = "us-central1"
}

variable "db_name" {
  description = "The name of the Cloud SQL database"
  type        = string
  default     = "promptionary"
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