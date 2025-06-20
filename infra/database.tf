resource "google_sql_database_instance" "main" {
  name             = var.db_name
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier = "db-f1-micro"
  }
}

resource "google_sql_user" "users" {
  name     = var.db_user
  instance = google_sql_database_instance.main.name
  password = var.db_password
}

resource "google_sql_database" "database" {
  name     = var.db_name
  instance = google_sql_database_instance.main.name
} 