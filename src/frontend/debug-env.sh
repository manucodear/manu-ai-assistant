#!/bin/bash
echo "=== Environment Variables Debug ==="
echo "NODE_ENV: $NODE_ENV"
echo "Current working directory: $(pwd)"
echo "Available .env files:"
ls -la .env*
echo ""
echo "Contents of .env:"
cat .env
echo ""
echo "Contents of .env.production:"
cat .env.production
echo ""
echo "=== Building with Vite ==="