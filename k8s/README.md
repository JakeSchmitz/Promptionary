# Kubernetes Manifests

This directory contains Kubernetes manifests for deploying Promptionary with domain routing.

## Files

### `prod-ingress.yaml`
Production Ingress configuration for:
- promptionary.ai
- www.promptionary.ai

Features:
- Google-managed SSL certificates
- Automatic HTTPS redirect
- Path-based routing to backend and frontend services

### `test-ingress.yaml`
Test environment Ingress configuration for:
- test.promptionary.ai

Features:
- Separate SSL certificate for test subdomain
- Same routing rules as production
- Isolated from production traffic

## Deployment

These manifests are automatically deployed by GitHub Actions:

**Production** (on push to main):
```bash
kubectl apply -f k8s/prod-ingress.yaml
```

**Test** (manual deployment):
```bash
kubectl apply -f k8s/test-ingress.yaml
```

## Manual Deployment

If you need to manually deploy:

1. Connect to the appropriate cluster:
   ```bash
   # Production
   gcloud container clusters get-credentials promptionary-gke-prod --zone us-central1
   
   # Test
   gcloud container clusters get-credentials promptionary-gke-test --zone us-central1
   ```

2. Apply the manifest:
   ```bash
   kubectl apply -f k8s/prod-ingress.yaml  # or test-ingress.yaml
   ```

3. Check status:
   ```bash
   kubectl get ingress
   kubectl get managedcertificate
   ```

## Troubleshooting

Check Ingress status:
```bash
kubectl describe ingress promptionary-ingress
```

Check certificate status:
```bash
kubectl describe managedcertificate promptionary-prod-cert  # or test-cert
```

View Ingress logs:
```bash
kubectl logs -n kube-system -l component=glbc
```