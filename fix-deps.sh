#!/bin/bash

# Quick Fix Script for Dependency Issues
# This script helps resolve common dependency conflicts

set -e

echo "🔧 Ship Fast - Dependency Fix Script"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Clean installation
print_status "Cleaning previous installation..."
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock

# Try different installation methods
print_status "Attempting installation with legacy peer deps..."
if npm install --legacy-peer-deps; then
    print_status "✅ Dependencies installed successfully with legacy peer deps!"
    echo ""
    print_status "You can now run: npm run dev"
    exit 0
fi

print_warning "Legacy peer deps failed, trying with --force..."
if npm install --force; then
    print_warning "⚠️  Dependencies installed with --force (may have warnings)"
    echo ""
    print_status "You can now run: npm run dev"
    exit 0
fi

print_error "❌ All installation methods failed."
print_error "Please check package.json for dependency conflicts."
echo ""
echo "You may need to:"
echo "1. Update incompatible dependencies"
echo "2. Remove problematic packages temporarily"
echo "3. Use different package versions"

exit 1
