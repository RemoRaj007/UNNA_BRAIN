#!/bin/bash

# UNNA Brain - Build Environment Verification Script
# This script verifies that all required tools and configurations are in place

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

section() {
    echo ""
    echo -e "${BLUE}═══ $1${NC}"
}

# Check if command exists and get version
check_command() {
    local cmd=$1
    local label=$2
    local min_version=$3

    if command -v "$cmd" &> /dev/null; then
        local version=$($cmd --version 2>&1 | head -n1)
        if [ -n "$min_version" ]; then
            success "$label: $version"
        else
            success "$label: $version"
        fi
        return 0
    else
        error "$label: Not installed"
        return 1
    fi
}

# Check if file exists
check_file() {
    local file=$1
    local description=$2

    if [ -f "$file" ]; then
        success "$description: Found at $file"
        return 0
    else
        error "$description: Missing at $file"
        return 1
    fi
}

# Check if directory exists
check_directory() {
    local dir=$1
    local description=$2

    if [ -d "$dir" ]; then
        success "$description: Found at $dir"
        return 0
    else
        error "$description: Missing at $dir"
        return 1
    fi
}

# Main verification
main() {
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    cd "$script_dir"

    echo ""
    echo -e "${BLUE}UNNA Brain - Build Environment Verification${NC}"

    local all_checks=0

    # Node.js and npm
    section "Node.js & npm"
    check_command "node" "Node.js" || all_checks=$((all_checks + 1))
    check_command "npm" "npm" || all_checks=$((all_checks + 1))

    # Frontend tools
    section "Frontend Tools"
    check_command "npx" "npx" || all_checks=$((all_checks + 1))
    if [ -f "node_modules/.bin/wrangler" ]; then
        local wrangler_version=$(npx wrangler --version 2>&1 | head -n1)
        success "wrangler: $wrangler_version"
    else
        error "wrangler: Not installed - run 'npm install'"
        all_checks=$((all_checks + 1))
    fi

    # Configuration files
    section "Configuration Files"
    check_file "wrangler.toml" "Wrangler config" || all_checks=$((all_checks + 1))
    check_file "package.json" "npm config" || all_checks=$((all_checks + 1))
    check_file "frontend/.assetsignore" "Frontend asset rules" || all_checks=$((all_checks + 1))

    # Frontend assets
    section "Frontend Assets"
    check_directory "frontend" "Frontend directory" || all_checks=$((all_checks + 1))
    check_file "frontend/index.html" "Frontend entry point" || all_checks=$((all_checks + 1))
    check_file "frontend/_redirects" "API routing rules" || all_checks=$((all_checks + 1))

    # Backend structure
    section "Backend Structure"
    check_directory "app" "FastAPI application" || all_checks=$((all_checks + 1))
    check_file "app/main.py" "FastAPI entry point" || all_checks=$((all_checks + 1))
    check_file "requirements.txt" "Python dependencies" || all_checks=$((all_checks + 1))

    # Python and Docker (optional)
    section "Optional Components"
    if command -v python3 &> /dev/null; then
        local python_version=$(python3 --version 2>&1)
        success "Python: $python_version"
    else
        warn "Python: Not found - required for backend development"
    fi

    if command -v docker &> /dev/null; then
        success "Docker: $(docker --version 2>&1)"
        if docker ps &> /dev/null; then
            success "Docker: Running"
        else
            warn "Docker: Not running - start with 'docker-compose up'"
        fi
    else
        warn "Docker: Not installed - required for containerized deployment"
    fi

    # Environment files
    section "Environment Configuration"
    if [ -f ".env.local" ]; then
        success ".env.local: Found"
    else
        warn ".env.local: Not found - copy from .env.local.example"
    fi
    check_file ".env.local.example" "Environment template" || all_checks=$((all_checks + 1))

    # Summary
    section "Summary"
    echo ""
    if [ $all_checks -eq 0 ]; then
        success "Build environment is properly configured!"
        echo ""
        echo "Next steps:"
        echo "  1. Configure .env.local with your credentials"
        echo "  2. Run 'npm run dev' to start development"
        echo "  3. Run 'npm run deploy' to deploy frontend"
        echo ""
        return 0
    else
        error "Some checks failed - please review the errors above"
        echo ""
        echo "See BUILD_ENVIRONMENT.md for detailed setup instructions"
        echo ""
        return 1
    fi
}

# Run main function
main
exit $?
