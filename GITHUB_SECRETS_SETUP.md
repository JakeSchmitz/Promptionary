# GitHub Secrets Setup

This document lists all the GitHub secrets needed for the Promptionary deployment workflows.

## Production Environment Secrets

Set these in your GitHub repository: Settings → Secrets and variables → Actions

| Secret Name | Value |
|-------------|-------|
| `PROD_DATABASE_URL` | `postgresql://postgres:Chester%26J0j0@127.0.0.1:5432/promptionary` |
| `PROD_INSTANCE_CONNECTION_NAME` | `promptionary-463502:us-central1:promptionary` |
| `OPENAI_API_KEY` | Your OpenAI API key (already set) |
| `GCP_PROJECT_ID` | `promptionary-463502` (already set) |
| `GCP_SA_KEY` | Your GCP service account key (already set) |

## Test Environment Secrets

| Secret Name | Value |
|-------------|-------|
| `TEST_DATABASE_URL` | `postgresql://postgres:Chester%26J0j0@127.0.0.1:5432/promptionary` |
| `TEST_INSTANCE_CONNECTION_NAME` | `promptionary-463502:us-central1:promptionary-test` |
| `OPENAI_API_KEY` | Your OpenAI API key (already set) |
| `GCP_PROJECT_ID` | `promptionary-463502` (already set) |
| `GCP_SA_KEY` | Your GCP service account key (already set) |

## Notes

- The `&` in the password is URL-encoded as `%26` in the DATABASE_URL
- Both environments use the same database password for now
- The instance connection names are different for prod vs test
- The database name is the same (`promptionary`) for both environments

## Workflow Changes Made

1. **Production Workflow** (`.github/workflows/deploy-backend.yml`):
   - Added step to create `promptionary-backend-secret` using GitHub secrets
   - Uses `PROD_DATABASE_URL`, `PROD_INSTANCE_CONNECTION_NAME`, and `OPENAI_API_KEY`

2. **Test Workflow** (`.github/workflows/deploy-test.yml`):
   - Updated to use the same secret pattern as production
   - Replaced ConfigMap approach with `promptionary-backend-secret`
   - Added health checks and proper resource limits
   - Uses `TEST_DATABASE_URL`, `TEST_INSTANCE_CONNECTION_NAME`, and `OPENAI_API_KEY`

## Backend Logging

The backend now logs database connection information on startup (with password masked) to help with debugging. 