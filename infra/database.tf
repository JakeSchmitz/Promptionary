resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "google_sql_database_instance" "main" {
  name             = "${var.project_name}-db-${var.environment}"
  database_version = "POSTGRES_15"
  region           = var.region
  deletion_protection = var.environment == "production" ? true : false

  settings {
    tier = var.db_tier
    
    # Enable automatic backups
    backup_configuration {
      enabled                        = true
      start_time                     = "02:00"
      point_in_time_recovery_enabled = var.environment == "production" ? true : false
      location                       = var.region
      transaction_log_retention_days = var.environment == "production" ? 7 : 1
      backup_retention_settings {
        retained_backups = var.environment == "production" ? 30 : 7
        retention_unit   = "COUNT"
      }
    }
    
    # Enable high availability for production
    availability_type = var.environment == "production" ? "REGIONAL" : "ZONAL"
    
    # Configure private IP
    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
      require_ssl     = true
    }
    
    # Maintenance window
    maintenance_window {
      day          = 7  # Sunday
      hour         = 3  # 3 AM
      update_track = "stable"
    }
    
    # Insights and monitoring
    insights_config {
      query_insights_enabled  = true
      query_string_length     = 1024
      record_application_tags = true
      record_client_address   = true
    }
    
    # Disk configuration
    disk_size         = var.db_disk_size
    disk_type         = "PD_SSD"
    disk_autoresize   = true
    disk_autoresize_limit = var.db_disk_size * 2
  }
  
  depends_on = [google_service_networking_connection.private_vpc_connection]
}

resource "google_sql_user" "app_user" {
  name     = "${var.project_name}-user"
  instance = google_sql_database_instance.main.name
  password = random_password.db_password.result
}

resource "google_sql_database" "database" {
  name     = var.db_name
  instance = google_sql_database_instance.main.name
}

# Store password in Secret Manager
resource "google_secret_manager_secret" "db_password" {
  secret_id = "${var.project_name}-db-password"
  
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}

# Service account for Cloud SQL access
resource "google_service_account" "sql_client" {
  account_id   = "${var.project_name}-sql-client"
  display_name = "Cloud SQL Client Service Account"
}

resource "google_project_iam_member" "sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.sql_client.email}"
}

# Outputs
output "db_connection_name" {
  description = "Cloud SQL connection name for use with Cloud SQL Auth Proxy"
  value       = google_sql_database_instance.main.connection_name
}

output "db_name" {
  description = "Database name"
  value       = google_sql_database.database.name
}

output "db_user" {
  description = "Database user"
  value       = google_sql_user.app_user.name
}

output "db_password_secret_id" {
  description = "Secret Manager secret ID for database password"
  value       = google_secret_manager_secret.db_password.secret_id
  sensitive   = true
}

output "sql_service_account_email" {
  description = "Service account email for SQL client"
  value       = google_service_account.sql_client.email
}

output "db_instance_name" {
  description = "Cloud SQL instance name"
  value       = google_sql_database_instance.main.name
} 