#!/bin/bash

# Ship Fast TypeScript Supabase - Automated Setup Script
# This script automates the project setup process
#
# Usage:
#   ./setup.sh          # Standard setup
#   ./setup.sh --clean   # Clean installation (removes node_modules, lock files)
#   ./setup.sh -c        # Same as --clean

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_status "Node.js version: $(node -v) ✓"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    print_status "npm version: $(npm -v) ✓"
}

# Clean installation function
clean_install() {
    print_status "Performing clean installation..."
    
    # Remove node_modules and lock files
    if [ -d "node_modules" ]; then
        print_status "Removing existing node_modules..."
        rm -rf node_modules
    fi
    
    if [ -f "package-lock.json" ]; then
        print_status "Removing package-lock.json..."
        rm -f package-lock.json
    fi
    
    if [ -f "yarn.lock" ]; then
        print_status "Removing yarn.lock..."
        rm -f yarn.lock
    fi
    
    print_status "Clean installation complete ✓"
}

# Install dependencies
install_dependencies() {
    print_status "Installing project dependencies..."
    
    # Clean up existing installations if package-lock.json exists but node_modules doesn't
    if [ -f "package-lock.json" ] && [ ! -d "node_modules" ]; then
        print_status "Cleaning up previous installation artifacts..."
        rm -f package-lock.json
    fi
    
    # First, try standard npm install
    if npm install 2>/dev/null; then
        print_status "Dependencies installed successfully ✓"
        return 0
    fi
    
    print_warning "Standard installation failed, trying with legacy peer deps..."
    touch .setup-warnings
    
    # If that fails, try with --legacy-peer-deps
    if npm install --legacy-peer-deps 2>/dev/null; then
        print_status "Dependencies installed with legacy peer deps ✓"
        return 0
    fi
    
    print_warning "Legacy peer deps failed, trying with --force..."
    
    # If that fails, try with --force
    if npm install --force 2>/dev/null; then
        print_warning "Dependencies installed with --force (may have warnings) ⚠️"
        return 0
    fi
    
    print_error "All installation methods failed. Please check package.json for dependency conflicts."
    print_error "You may need to manually resolve dependency issues."
    print_error "Try running: ./setup.sh --clean"
    exit 1
}

# Setup environment file
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_status "Created .env file from .env.example"
        else
            # Create a basic .env template
            cat > .env << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Stripe Configuration (Optional)
STRIPE_PUBLIC_KEY=your_stripe_public_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# Email Configuration (Optional)
EMAIL_FROM=your_email_here
MAILGUN_API_KEY=your_mailgun_api_key_here
MAILGUN_DOMAIN=your_mailgun_domain_here

# Redis Configuration (Optional)
REDIS_URL=your_redis_url_here

# Development
NODE_ENV=development
EOF
            print_status "Created .env template file"
        fi
    else
        print_warning ".env file already exists, skipping creation"
    fi
    
    print_warning "Please update the .env file with your actual configuration values!"
}

# Check TypeScript setup
check_typescript() {
    print_status "Checking TypeScript configuration..."
    
    if [ ! -f "tsconfig.json" ]; then
        print_error "tsconfig.json not found!"
        exit 1
    fi
    
    # Run TypeScript check
    if npm run lint &> /dev/null; then
        print_status "TypeScript configuration is valid ✓"
    else
        print_warning "TypeScript warnings detected, but continuing setup..."
    fi
}

# Setup database (if applicable)
setup_database() {
    print_status "Database setup information:"
    echo "  1. Create a Supabase project at https://supabase.com"
    echo "  2. Copy your project URL and anon key to .env file"
    echo "  3. Run database migrations if needed"
    echo "  4. Import the schema from supabase_database.sql if available"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    directories=("logs" "temp" "uploads")
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_status "Created directory: $dir"
        fi
    done
}

# Final setup verification
verify_setup() {
    print_status "Verifying setup..."
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_error "node_modules directory not found. Installation may have failed."
        exit 1
    fi
    
    # Check key files
    key_files=("package.json" "next.config.js" "tailwind.config.js")
    for file in "${key_files[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "Required file missing: $file"
            exit 1
        fi
    done
    
    print_status "Setup verification completed ✓"
}

# Main setup function
main() {
    print_header "Ship Fast TypeScript Supabase Setup"
    
    # Check for clean install flag
    if [[ "$1" == "--clean" || "$1" == "-c" ]]; then
        print_status "Clean installation requested..."
        clean_install
    fi
    
    print_status "Starting automated setup process..."
    
    # Pre-flight checks
    check_node
    check_npm
    
    # Setup steps
    install_dependencies
    setup_environment
    create_directories
    check_typescript
    verify_setup
    
    print_header "Setup Complete!"
    
    echo ""
    print_status "Next steps:"
    echo "  1. Update your .env file with actual configuration values"
    echo "  2. Set up your Supabase database"
    echo "  3. Run 'npm run dev' to start the development server"
    echo "  4. Visit http://localhost:3000 to see your application"
    echo ""
    
    setup_database
    
    echo ""
    print_status "🚀 Your Ship Fast TypeScript Supabase project is ready!"
    print_status "Run 'npm run dev' to start developing!"
    
    # Show additional help if installation had issues
    if [[ -f ".setup-warnings" ]]; then
        echo ""
        print_warning "Some issues were encountered during setup. Check the warnings above."
        print_status "If you continue to have issues, try running: ./setup.sh --clean"
        rm -f .setup-warnings
    fi
}

# Run the main function
main "$@"
