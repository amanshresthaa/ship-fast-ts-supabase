#!/bin/bash

# Quick Start Script for Ship Fast TypeScript Supabase
# This is a simplified version for immediate development

set -e

echo "🚀 Ship Fast TypeScript Supabase - Quick Start"
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env file from template"
        echo "⚠️  Please update .env with your actual configuration values!"
    else
        echo "⚠️  No .env.example found. Please create .env manually."
    fi
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo "1. Update your .env file with actual values"
echo "2. Set up your Supabase project"
echo "3. Run: npm run dev"
echo ""
echo "🌐 Development server will be available at: http://localhost:3000"
