resource "google_compute_network" "vpc_network" {
  name = "promptionary-network-${var.environment}"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = "promptionary-subnet-${var.environment}"
  ip_cidr_range = var.environment == "prod" ? "10.0.0.0/16" : "10.1.0.0/16"
  region        = var.region
  network       = google_compute_network.vpc_network.id
} 