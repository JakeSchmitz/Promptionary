# Domain Setup Guide for promptionary.ai

This guide walks you through setting up your domain (promptionary.ai) to work with the Promptionary infrastructure.

## Prerequisites

- Domain registered (promptionary.ai)
- Access to your domain registrar's DNS settings
- Terraform infrastructure deployed

## Step 1: Deploy Infrastructure

1. First, deploy the production infrastructure:
   ```bash
   cd infra
   terraform workspace select prod
   terraform apply -var-file=environments/prod.tfvars
   ```

2. Deploy the test infrastructure:
   ```bash
   terraform workspace select test
   terraform apply -var-file=environments/test.tfvars
   ```

## Step 2: Update Domain Nameservers

After terraform completes, you'll see output like:
```
nameservers = [
  "ns-cloud-a1.googledomains.com.",
  "ns-cloud-a2.googledomains.com.",
  "ns-cloud-a3.googledomains.com.",
  "ns-cloud-a4.googledomains.com."
]
```

1. Log into your domain registrar (where you bought the domain)
2. Find the DNS/Nameserver settings
3. Change from default nameservers to custom nameservers
4. Enter the Google Cloud DNS nameservers from the terraform output
5. Save the changes

**Note**: Nameserver changes can take 24-48 hours to fully propagate.

## Step 3: Verify DNS Setup

You can verify DNS is working:

```bash
# Check nameservers
dig NS promptionary.ai

# Check A records (after propagation)
dig A promptionary.ai
dig A www.promptionary.ai
dig A test.promptionary.ai
```

## Step 4: Deploy Applications

The GitHub Actions workflows will automatically:
1. Create the Kubernetes Ingress resources
2. Provision SSL certificates
3. Configure routing

For production (automatic on push to main):
- https://promptionary.ai
- https://www.promptionary.ai

For test (manual deployment):
1. Go to GitHub Actions
2. Run "Deploy to Test Environment"
3. Select your branch
4. Access at: https://test.promptionary.ai

## Step 5: SSL Certificate Provisioning

Google automatically provisions SSL certificates for your domains:
- This process can take up to 15 minutes
- During this time, you may see SSL warnings
- The site will show as "Not Secure" until certificates are ready

To check certificate status:
```bash
# For production
kubectl describe managedcertificate promptionary-prod-cert

# For test
kubectl describe managedcertificate promptionary-test-cert
```

## Troubleshooting

### DNS Not Resolving

1. Verify nameservers are updated at registrar
2. Wait for propagation (up to 48 hours)
3. Check with: https://www.whatsmydns.net/

### SSL Certificate Not Working

1. Check certificate status:
   ```bash
   kubectl get managedcertificate
   ```

2. Ensure DNS is properly configured (certificates need valid DNS)

3. Check Ingress status:
   ```bash
   kubectl describe ingress promptionary-ingress
   ```

### 404 Errors

1. Verify services are running:
   ```bash
   kubectl get services
   kubectl get deployments
   ```

2. Check Ingress paths:
   ```bash
   kubectl get ingress promptionary-ingress -o yaml
   ```

## Alternative: Using External DNS

If you prefer not to use Google Cloud DNS:

1. Keep your existing DNS provider
2. Create A records pointing to the static IPs:
   - `promptionary.ai` → Production IP (from terraform output)
   - `www.promptionary.ai` → Production IP
   - `test.promptionary.ai` → Test IP

3. Remove the DNS terraform resources from `dns.tf`

## Security Notes

- All traffic is forced to HTTPS
- HTTP requests are automatically redirected
- Certificates are auto-renewed by Google
- DNSSEC is enabled for additional security