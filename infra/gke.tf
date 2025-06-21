resource "google_container_cluster" "primary" {
  name     = var.gke_cluster_name
  location = var.zone
  
  # Network configuration
  network    = google_compute_network.vpc.id
  subnetwork = google_compute_subnetwork.subnet.id
  
  # We'll manage the node pool separately
  initial_node_count       = 1
  remove_default_node_pool = true
  deletion_protection      = var.environment == "production" ? true : false
  
  # Workload Identity
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }
  
  # IP allocation for pods and services
  ip_allocation_policy {
    cluster_secondary_range_name  = "gke-pods"
    services_secondary_range_name = "gke-services"
  }
  
  # Security settings
  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }
  
  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = "0.0.0.0/0"
      display_name = "All networks"
    }
  }
  
  # Maintenance window
  maintenance_policy {
    daily_maintenance_window {
      start_time = "03:00"
    }
  }
  
  # Monitoring and logging
  monitoring_service = "monitoring.googleapis.com/kubernetes"
  logging_service    = "logging.googleapis.com/kubernetes"
  
  # Network policy
  network_policy {
    enabled = true
  }
  
  # Binary Authorization
  binary_authorization {
    evaluation_mode = var.environment == "production" ? "PROJECT_SINGLETON_POLICY_ENFORCE" : "DISABLED"
  }
  
  # Release channel
  release_channel {
    channel = var.environment == "production" ? "STABLE" : "REGULAR"
  }
}

# Separately managed node pool
resource "google_container_node_pool" "primary_nodes" {
  name       = "${var.gke_cluster_name}-node-pool"
  location   = var.zone
  cluster    = google_container_cluster.primary.name
  node_count = var.gke_node_count
  
  # Autoscaling
  autoscaling {
    min_node_count = var.environment == "production" ? 2 : 1
    max_node_count = var.environment == "production" ? 10 : 5
  }
  
  # Node management
  management {
    auto_repair  = true
    auto_upgrade = true
  }
  
  # Node configuration
  node_config {
    preemptible  = var.environment != "production"
    machine_type = var.gke_node_machine_type
    disk_size_gb = 50
    disk_type    = "pd-standard"
    
    # Google recommends custom service accounts that have cloud-platform scope and permissions granted via IAM Roles.
    service_account = google_service_account.gke_node.email
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
    
    # Workload Identity
    workload_metadata_config {
      mode = "GKE_METADATA"
    }
    
    # Shielded instance
    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }
    
    # Labels
    labels = {
      environment = var.environment
      managed_by  = "terraform"
    }
    
    # Metadata
    metadata = {
      disable-legacy-endpoints = "true"
    }
  }
}

# Service account for GKE nodes
resource "google_service_account" "gke_node" {
  account_id   = "${var.project_name}-gke-node"
  display_name = "GKE Node Service Account"
}

# Grant necessary permissions to the node service account
resource "google_project_iam_member" "gke_node_log_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.gke_node.email}"
}

resource "google_project_iam_member" "gke_node_metric_writer" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.gke_node.email}"
}

resource "google_project_iam_member" "gke_node_monitoring_viewer" {
  project = var.project_id
  role    = "roles/monitoring.viewer"
  member  = "serviceAccount:${google_service_account.gke_node.email}"
}

resource "google_project_iam_member" "gke_node_gcr" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${google_service_account.gke_node.email}"
} 