#!/usr/bin/env bash

# ═══════════════════════════════════════════════════════════════════════════════
# 🚀 NUKE.SH - Complete Project Reset Script
# ═══════════════════════════════════════════════════════════════════════════════

# Color definitions for better readability
readonly BLUE='\033[0;34m'
readonly GREEN='\033[0;32m'
readonly RED='\033[0;31m'
readonly YELLOW='\033[1;33m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly RESET='\033[0m'
readonly BOLD='\033[1m'

# Icons for visual appeal
readonly INFO_ICON="🔍"
readonly SUCCESS_ICON="✅"
readonly FAIL_ICON="❌"
readonly WARN_ICON="⚠️"
readonly ROCKET_ICON="🚀"
readonly CLEAN_ICON="🧹"
readonly BUILD_ICON="🔨"

# ═══════════════════════════════════════════════════════════════════════════════
# Logging Functions
# ═══════════════════════════════════════════════════════════════════════════════

info() {
    printf "\r  ${CYAN}${INFO_ICON}${RESET} ${BOLD}%s${RESET}\n" "$1"
}

success() {
    printf "\r\033[2K  ${GREEN}${SUCCESS_ICON} %s${RESET}\n" "$1"
}

warn() {
    printf "\r\033[2K  ${YELLOW}${WARN_ICON} %s${RESET}\n" "$1"
}

fail() {
    printf "\r\033[2K  ${RED}${FAIL_ICON} %s${RESET}\n" "$1"
    echo
    exit 1
}

step() {
    printf "\n${PURPLE}▶${RESET} ${BOLD}%s${RESET}\n" "$1"
}

# ═══════════════════════════════════════════════════════════════════════════════
# Main Script
# ═══════════════════════════════════════════════════════════════════════════════

LOG_FILE="$(pwd)/nuke.log"

# Clean up previous log file
[[ ! -e "$LOG_FILE" ]] || rm "$LOG_FILE"

# Display the mushroom cloud art (everyone loves a mushroom cloud ;)
if hash base64 2>/dev/null && hash gunzip 2>/dev/null; then
    echo -e "${BOLD}${YELLOW}"
    base64 --decode <<<"H4sIAJQcFFwAA11NQQrDMAy7+xW6NYHiPKAv2B8CTgeBHsYKbcbopW+fHRraTrYSI0UO0CBgsbOvEzXZCTo4JMCrzSL+sJyWtRrK5O1uphOxYE2zqtb9GbX3+56ibmYEG0+jYjD+aUEZSa4IAv0o3jSy2KN0K8qUMb9fG77jhjLjmbF+lsxE9APlrOhe9gAAAA==" | gunzip
    echo -e "${RESET}"
fi

echo -e "${BOLD}${PURPLE}╔════════════════════════════════════════════════════════╗"
echo -e "║                🎯 PROJECT NUKE INITIATED               ║"
echo -e "╚════════════════════════════════════════════════════════╝${RESET}\n"

# Add this function before the Main Script section
has_docker_files() {
    [[ -f "Dockerfile" ]] || [[ -f "docker-compose.yml" ]] || [[ -f "docker-compose.yaml" ]]
}

# ───────────────────────────────────────────────────────────────────────────────
step "${CLEAN_ICON} DOCKER CLEANUP"
# ───────────────────────────────────────────────────────────────────────────────
if ! has_docker_files; then
    info "No Docker configuration found - skipping Docker operations"
else
    info "Stopping Docker services and removing all resources..."

    # Check if Docker is running first
    if ! docker info >/dev/null 2>&1; then
        warn "Docker daemon is not running - skipping Docker cleanup"
        info "You may need to start Docker manually and run cleanup later"
    elif ! docker compose ps >/dev/null 2>&1; then
        warn "No Docker Compose services found - skipping Docker cleanup"
        info "This is normal if no services were previously running"
    else
        if docker compose down --rmi all --volumes >> "$LOG_FILE" 2>&1; then
            success "Docker services stopped and resources cleaned"
        else
            warn "Docker cleanup encountered issues - check $LOG_FILE for details"
            info "Continuing with the rest of the script..."
        fi
    fi
fi

# ───────────────────────────────────────────────────────────────────────────────
step "${CLEAN_ICON} BUILD ARTIFACTS & CACHE CLEANUP"
# ───────────────────────────────────────────────────────────────────────────────

# Define common build/cache directories for different frameworks
BUILD_DIRS=(
    "node_modules"          # All Node.js projects
    "dist"                  # Vite, Webpack, Rollup builds
    "build"                 # Create React App, general builds
    ".next"                 # Next.js build cache
    ".nuxt"                 # Nuxt.js build cache
    "out"                   # Next.js static export
    ".output"               # Nuxt 3 build output
    ".vite"                 # Vite cache
    ".cache"                # General cache directory
    ".parcel-cache"         # Parcel bundler cache
    ".webpack"              # Webpack cache
    "coverage"              # Test coverage reports
    ".nyc_output"           # NYC coverage tool output
    "storybook-static"      # Storybook build output
    ".storybook-out"        # Alternative Storybook output
    ".turbo"                # Turborepo cache
    ".rush"                 # Rush cache
    "lib"                   # Common library build output
    "es"                    # ES modules build output
    "cjs"                   # CommonJS build output
    "umd"                   # UMD build output
)

CACHE_DIRS=(
    ".pnpm-store"           # PNPM cache
    ".yarn/cache"           # Yarn cache
    ".npm"                  # NPM cache
    "node_modules/.cache"   # Node modules cache
)

# Clean build directories
info "Scanning for build artifacts and cache directories..."
removed_count=0

deleted_any=false
for dir in "${BUILD_DIRS[@]}"; do
    if [[ -d "$dir" ]]; then
        info "Removing $dir..."
        rm -rf "$dir" || true  # Prevent exit if removal fails
        success "$dir removed"
        ((removed_count++))
        deleted_any=true
    fi
    # After removing node_modules, continue script execution
    # Do not exit or return here
    # This ensures dependency installation will always run after cleanup
    # and script will not stop after removing node_modules
    # (No early exit or return)
done

# Clean cache directories
for dir in "${CACHE_DIRS[@]}"; do
    if [[ -d "$dir" ]]; then
        info "Removing cache directory $dir..."
        rm -rf "$dir" || true  # Prevent exit if removal fails
        success "$dir cache removed"
        ((removed_count++))
        deleted_any=true
    fi
    # Same as above: do not exit or return here
    # Ensure script continues
    # (No early exit or return)
done

if [[ $removed_count -eq 0 ]]; then
    info "No build artifacts or cache directories found (project already clean)"
else
    success "Removed $removed_count build/cache directories"
fi

# Clean package manager caches
info "Cleaning package manager caches..."
cache_cleaned=false

if hash npm 2>/dev/null; then
    if npm cache clean --force >> "$LOG_FILE" 2>&1; then
        success "npm cache cleaned"
        cache_cleaned=true
    fi
fi

if hash yarn 2>/dev/null; then
    if yarn cache clean >> "$LOG_FILE" 2>&1; then
        success "yarn cache cleaned"
        cache_cleaned=true
    fi
fi

if hash pnpm 2>/dev/null; then
    if pnpm store prune >> "$LOG_FILE" 2>&1; then
        success "pnpm store cleaned"
        cache_cleaned=true
    fi
fi

if [[ $cache_cleaned == false ]]; then
    info "No package manager caches cleaned (tools not available)"
fi

# ───────────────────────────────────────────────────────────────────────────────
step "${BUILD_ICON} DEPENDENCY INSTALLATION"
# ───────────────────────────────────────────────────────────────────────────────
info "Detecting package manager and installing dependencies..."

if [[ -f "pnpm-lock.yaml" ]] && hash pnpm 2>/dev/null; then
    info "Using pnpm (detected pnpm-lock.yaml)..."
    if pnpm install >> "$LOG_FILE" 2>&1; then
        success "Dependencies installed successfully with pnpm"
    else
        fail "pnpm install failed - check $LOG_FILE for details"
    fi
elif [[ -f "yarn.lock" ]] && hash yarn 2>/dev/null; then
    info "Using yarn (detected yarn.lock)..."
    if yarn install >> "$LOG_FILE" 2>&1; then
        success "Dependencies installed successfully with yarn"
    else
        fail "yarn install failed - check $LOG_FILE for details"
    fi
elif [[ -f "package-lock.json" ]] && hash npm 2>/dev/null; then
    info "Using npm (detected package-lock.json)..."
    if npm install >> "$LOG_FILE" 2>&1; then
        success "Dependencies installed successfully with npm"
    else
        fail "npm install failed - check $LOG_FILE for details"
    fi
elif hash npm 2>/dev/null; then
    info "Using npm (fallback)..."
    if npm install >> "$LOG_FILE" 2>&1; then
        success "Dependencies installed successfully with npm"
    else
        fail "npm install failed - check $LOG_FILE for details"
    fi
elif hash yarn 2>/dev/null; then
    info "Using yarn (fallback)..."
    if yarn install >> "$LOG_FILE" 2>&1; then
        success "Dependencies installed successfully with yarn"
    else
        fail "yarn install failed - check $LOG_FILE for details"
    fi
elif hash pnpm 2>/dev/null; then
    info "Using pnpm (fallback)..."
    if pnpm install >> "$LOG_FILE" 2>&1; then
        success "Dependencies installed successfully with pnpm"
    else
        fail "pnpm install failed - check $LOG_FILE for details"
    fi
else
    fail "No package manager found (npm/yarn/pnpm). Please install dependencies manually."
fi

# ───────────────────────────────────────────────────────────────────────────────
step "${BUILD_ICON} DOCKER REBUILD"
# ───────────────────────────────────────────────────────────────────────────────

if ! has_docker_files; then
    # Skip Docker section entirely and show success message
    echo
    echo -e "${BOLD}${GREEN}════════════════════════════════════════════════════════"
    echo -e "          🎉 PROJECT SUCCESSFULLY NUKED! 🎉           "
    echo -e "                                                    "
    echo -e "  ✨ All build artifacts & caches removed           "
    echo -e "  📦 Dependencies freshly installed               "
    echo -e "                                                    "
    echo -e "  📋 Check nuke.log for detailed logs           "
    echo -e "════════════════════════════════════════════════════════${RESET}"
    echo
    exit 0
fi

# Check if Docker is available before attempting to build
if ! docker info >/dev/null 2>&1; then
    warn "Docker daemon is not running - skipping Docker rebuild"
    info "Start Docker manually and run 'docker-compose build --pull --no-cache' later"
    echo
    echo -e "${BOLD}${YELLOW}════════════════════════════════════════════════════════"
    echo -e "              🎯 PARTIAL NUKE COMPLETED! 🎯             "
    echo -e "                                                        "
    echo -e "  ✅ Build artifacts & caches removed                   "
    echo -e "  ✅ Dependencies freshly installed                     "
    echo -e "  ⚠️  Docker services skipped (Docker not running)     "
    echo -e "                                                        "
    echo -e "  📋 Check nuke.log for detailed logs               "
    echo -e "  🐳 Start Docker and run rebuild commands manually    "
    echo -e "════════════════════════════════════════════════════════${RESET}"
    echo
    exit 0
fi

info "Building Docker resources (this may take a while...)..."
printf "   ${YELLOW}⏳ Please be patient - pulling fresh images and building...${RESET}\n"

if docker-compose build --pull --no-cache >> "$LOG_FILE" 2>&1; then
    success "Docker images built successfully"
else
    fail "Docker build encountered issues - check $LOG_FILE for details"
fi

# ───────────────────────────────────────────────────────────────────────────────
step "${ROCKET_ICON} LAUNCH"
# ───────────────────────────────────────────────────────────────────────────────
info "Starting Docker services in detached mode..."
if docker compose up -d >> "$LOG_FILE" 2>&1; then
    success "Docker services started successfully"
else
    fail "Failed to start Docker services - check $LOG_FILE for details"
fi

# ───────────────────────────────────────────────────────────────────────────────
# Final Success Message
# ───────────────────────────────────────────────────────────────────────────────
echo
echo -e "${BOLD}${GREEN}════════════════════════════════════════════════════════"
echo -e "          🎉 PROJECT SUCCESSFULLY NUKED! 🎉           "
echo -e "                                                    "
echo -e "  ✨ All build artifacts & caches removed           "
echo -e "  🐳 Docker containers rebuilt from scratch        "
echo -e "  📦 Dependencies freshly installed               "
echo -e "  🚀 Services running in detached mode             "
echo -e "                                                    "
echo -e "  📋 Check nuke.log for detailed logs           "
echo -e "════════════════════════════════════════════════════════${RESET}"
echo