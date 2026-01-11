# Git Author Fix Guide

## Problem
Git commit author showing as blank or wrong name when doing `git pull` or viewing commits.

## Solution - Run these commands on your LOCAL machine:

### 1. Configure Git User (PENTING!)
```bash
git config --global user.name "BF667"
git config --global user.email "bf667@github.com"
```

### 2. Verify Configuration
```bash
git config --global user.name
# Should output: BF667

git config --global user.email
# Should output: bf667@github.com
```

### 3. Clone Repository Fresh (if needed)
```bash
# Remove old clone if exists
rm -rf simple-base-api

# Clone fresh
git clone https://github.com/SawitProject/simple-base-api.git
cd simple-base-api
```

### 4. Or Fix Existing Local Repository
```bash
cd simple-base-api

# Set local config (overrides global)
git config user.name "BF667"
git config user.email "bf667@github.com"

# Check current commits
git log --oneline -5 --format="%h %an %s"
```

### 5. Pull with Rebase (to update author locally)
```bash
git pull origin main --rebase
```

## Check GitHub Repository
Visit: https://github.com/SawitProject/simple-base-api/commits/main

You should see:
- **BF667** - docs: Add git setup script for BF667 (LATEST)
- **BF667** - feat: Complete API overhaul with new features and dynamic UX
- **Iya iya** - Initial commit (original repo owner)

## If Still Not Working
Try this nuclear option to completely reset your local copy:

```bash
cd simple-base-api
rm -rf .git
git init
git remote add origin https://github.com/SawitProject/simple-base-api.git
git add .
git commit -m "Initial commit from BF667"
git push -f origin main
```

But warn others first if this is a team project!
