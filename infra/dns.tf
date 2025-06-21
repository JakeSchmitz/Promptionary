resource "google_dns_managed_zone" "promptionary" {
  name        = "promptionary-zone"
  dns_name    = "promptionary.ai."
  description = "DNS zone for promptionary.ai"
  
  dnssec_config {
    state = "on"
  }
}

# Production records
resource "google_dns_record_set" "promptionary_a" {
  name = google_dns_managed_zone.promptionary.dns_name
  type = "A"
  ttl  = 300

  managed_zone = google_dns_managed_zone.promptionary.name
  rrdatas      = [google_compute_global_address.prod_ip.address]
}

resource "google_dns_record_set" "www" {
  name = "www.${google_dns_managed_zone.promptionary.dns_name}"
  type = "A"
  ttl  = 300

  managed_zone = google_dns_managed_zone.promptionary.name
  rrdatas      = [google_compute_global_address.prod_ip.address]
}

# Test subdomain
resource "google_dns_record_set" "test" {
  name = "test.${google_dns_managed_zone.promptionary.dns_name}"
  type = "A"
  ttl  = 300

  managed_zone = google_dns_managed_zone.promptionary.name
  rrdatas      = [google_compute_global_address.test_ip.address]
}

# Reserved IP addresses for the load balancers
resource "google_compute_global_address" "prod_ip" {
  name = "promptionary-prod-ip"
}

resource "google_compute_global_address" "test_ip" {
  name = "promptionary-test-ip"
}

# Outputs
output "nameservers" {
  description = "Nameservers for the DNS zone - update these at your domain registrar"
  value       = google_dns_managed_zone.promptionary.name_servers
}

output "prod_ip_address" {
  description = "Production environment IP address"
  value       = google_compute_global_address.prod_ip.address
}

output "test_ip_address" {
  description = "Test environment IP address"
  value       = google_compute_global_address.test_ip.address
}