#!/bin/bash

# Git Setup Script for BF667
# Run this script to configure git properly

echo "🔧 Setting up Git for BF667..."

# Configure git user
git config --global user.name "BF667"
git config --global user.email "bf667@github.com"

echo "✅ Git configured:"
echo "   user.name = $(git config --global user.name)"
echo "   user.email = $(git config --global user.email)"
echo ""
echo "📝 To clone and use the repository:"
echo "   git clone https://github.com/SawitProject/simple-base-api.git"
echo "   cd simple-base-api"
echo ""
echo "✅ Done! Your commits will now show 'BF667' as author."
