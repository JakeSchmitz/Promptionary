#!/bin/bash

# test.sh - Run all tests for Promptionary (frontend, backend, etc.)
# For now, this only runs frontend Jest tests.
#
# Usage:
#   ./test.sh          # Run tests without coverage
#   ./test.sh --coverage # Run tests with coverage

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/apps/frontend"

# Check if coverage flag is provided
COVERAGE_FLAG=""
if [[ "$1" == "--coverage" ]]; then
    COVERAGE_FLAG="--coverage"
    echo "Coverage reporting enabled"
fi

# Print header
echo "====================================="
echo " Running Promptionary Test Suite"
echo "====================================="

# Run frontend tests
cd "$FRONTEND_DIR"
echo "\n--- Running Frontend Tests (Jest) ---"
npx jest --passWithNoTests $COVERAGE_FLAG

# TODO: Add backend tests when available

cd "$ROOT_DIR"
echo "\nAll tests complete." 