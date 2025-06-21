resource "google_container_cluster" "primary" {
  name     = "promptionary-gke-${var.environment}"
  location = var.region

  network    = google_compute_network.vpc_network.id
  subnetwork = google_compute_subnetwork.subnet.id

  initial_node_count = 1
  deletion_protection = false

  ip_allocation_policy {}

  node_config {
    machine_type = var.environment == "prod" ? "e2-small" : "e2-micro"
    disk_size_gb = 20
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
} 