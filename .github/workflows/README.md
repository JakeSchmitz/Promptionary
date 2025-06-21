# GitHub Workflows

This directory contains GitHub Actions workflows for CI/CD of the Promptionary application.

## Workflows

### 1. PR Checks (`pr-checks.yml`)

**Trigger**: Pull requests to main branch

**Purpose**: Ensures code quality by running tests and checks before merging

**Jobs**:
- **Frontend Tests and Linting**: 
  - Runs ESLint checks
  - Runs Jest tests with coverage
  - Builds the frontend application
- **Backend Checks**:
  - Generates Prisma client
  - Builds the backend application

**Required to Pass**: Yes - PRs cannot be merged without passing these checks

### 2. Deploy Backend (`deploy-backend.yml`)

**Trigger**: Push to main branch

**Purpose**: Deploys the backend service to production GKE cluster

**Actions**:
- Builds Docker image
- Pushes to Google Container Registry
- Deploys to `promptionary-gke-prod` cluster
- Runs database migrations
- Creates LoadBalancer service

### 3. Deploy Frontend (`deploy-frontend.yml`)

**Trigger**: Push to main branch

**Purpose**: Deploys the frontend service to production GKE cluster

**Actions**:
- Builds Docker image
- Pushes to Google Container Registry
- Deploys to `promptionary-gke-prod` cluster
- Creates LoadBalancer service

### 4. Deploy to Test Environment (`deploy-test.yml`)

**Trigger**: Manual (workflow_dispatch)

**Inputs**: 
- `branch`: Branch name to deploy (default: main)

**Purpose**: Deploy any branch to the test environment for testing

**Actions**:
- Checks out the specified branch
- Builds and deploys backend to `promptionary-gke-test`
- Builds and deploys frontend to `promptionary-gke-test`
- Outputs the service URLs for testing

## Branch Protection

To enforce PR checks before merging:

1. Go to Settings → Branches
2. Add a branch protection rule for `main`
3. Enable "Require status checks to pass before merging"
4. Select these status checks:
   - `Frontend Tests and Linting`
   - `Backend Type Checking and Build`
5. Enable "Require branches to be up to date before merging"

## Required GitHub Secrets

See [infra/README.md](../../infra/README.md) for the complete list of required secrets.

## Usage Examples

### Deploy a feature branch to test:

1. Go to Actions tab
2. Select "Deploy to Test Environment"
3. Click "Run workflow"
4. Enter your branch name
5. Click "Run workflow"
6. Wait for deployment and check the output URLs

### Check PR status:

1. Create a pull request
2. Check the "Checks" tab in the PR
3. All checks must pass before merging is allowed