resource "google_compute_network" "vpc_network" {
  name = "promptionary-network"
}

resource "google_compute_subnetwork" "subnet" {
  name          = "promptionary-subnet"
  ip_cidr_range = "10.0.0.0/16"
  region        = var.region
  network       = google_compute_network.vpc_network.id
} 