terraform {
  backend "gcs" {
    bucket = "promptionary-terraform-state"
    prefix = "promptionary"
  }
}