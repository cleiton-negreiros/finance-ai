#!/bin/bash
# Finance AI - Termux Setup Script

echo "Finance AI - Termux Setup"
echo "========================"

# Check if we're in the right directory
if [ ! -f "package-termux.json" ]; then
    echo "Error: Run this script from the finance-ai directory"
    exit 1
fi

# Backup original package.json
if [ ! -f "package.json.bak" ]; then
    cp package.json package.json.bak
fi

# Use Termux-compatible package.json
cp package-termux.json package.json

# Remove existing node_modules
if [ -d "node_modules" ]; then
    echo "Removing old node_modules..."
    rm -rf node_modules package-lock.json
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Create database directory if it doesn't exist
mkdir -p database

# Create uploads directory if it doesn't exist
mkdir -p backend/uploads

echo ""
echo "Setup complete!"
echo ""
echo "To start the server:"
echo "  node backend/server-termux.js"
echo ""
echo "Then open in browser:"
echo "  http://localhost:3000"
