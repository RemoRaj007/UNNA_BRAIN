#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// Helper functions
const success = (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`);
const error = (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`);
const warn = (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`);
const info = (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`);

function checkCommand(command, label, minVersion = null) {
  try {
    const result = execSync(`${command} --version`, { encoding: 'utf8' }).trim();
    const version = result.split('\n')[0];

    if (minVersion) {
      const actual = extractVersion(result);
      const required = parseVersion(minVersion);
      const current = parseVersion(actual);

      if (current >= required) {
        success(`${label}: ${version}`);
        return true;
      } else {
        error(`${label}: ${version} (requires ${minVersion}+)`);
        return false;
      }
    } else {
      success(`${label}: ${version}`);
      return true;
    }
  } catch {
    error(`${label}: Not installed`);
    return false;
  }
}

function extractVersion(str) {
  const match = str.match(/(\d+\.\d+\.\d+)/);
  return match ? match[1] : '0.0.0';
}

function parseVersion(versionStr) {
  const parts = versionStr.split('.');
  return {
    major: parseInt(parts[0]) || 0,
    minor: parseInt(parts[1]) || 0,
    patch: parseInt(parts[2]) || 0,
  };
}

function isVersionGreaterOrEqual(parsed, min) {
  if (parsed.major > min.major) return true;
  if (parsed.major < min.major) return false;
  if (parsed.minor > min.minor) return true;
  if (parsed.minor < min.minor) return false;
  return parsed.patch >= min.patch;
}

function fileExists(filePath, description) {
  const fullPath = path.join(rootDir, filePath);
  if (fs.existsSync(fullPath)) {
    success(`${description}: Found at ${filePath}`);
    return true;
  } else {
    error(`${description}: Missing at ${filePath}`);
    return false;
  }
}

function directoryExists(dirPath, description) {
  const fullPath = path.join(rootDir, dirPath);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    success(`${description}: Found at ${dirPath}`);
    return true;
  } else {
    error(`${description}: Missing at ${dirPath}`);
    return false;
  }
}

function checkNpmPackage(packageName) {
  try {
    const packagePath = path.join(rootDir, 'node_modules', packageName);
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(packagePath, 'package.json'), 'utf8')
      );
      success(`npm package "${packageName}": v${packageJson.version}`);
      return true;
    } else {
      error(`npm package "${packageName}": Not installed`);
      return false;
    }
  } catch {
    error(`npm package "${packageName}": Error checking`);
    return false;
  }
}

// Main verification
async function verifyEnvironment() {
  console.log(`\n${colors.blue}UNNA Brain - Build Environment Verification${colors.reset}\n`);

  let allChecks = true;

  // Node.js and npm
  console.log(`${colors.blue}═══ Node.js & npm${colors.reset}`);
  allChecks &= checkCommand('node', 'Node.js', '18.0.0');
  allChecks &= checkCommand('npm', 'npm', '9.0.0');
  console.log();

  // Frontend dependencies
  console.log(`${colors.blue}═══ Frontend Dependencies${colors.reset}`);
  allChecks &= checkNpmPackage('wrangler');
  console.log();

  // Configuration files
  console.log(`${colors.blue}═══ Configuration Files${colors.reset}`);
  allChecks &= fileExists('wrangler.toml', 'Wrangler config');
  allChecks &= fileExists('package.json', 'npm config');
  allChecks &= fileExists('frontend/.assetsignore', 'Frontend asset rules');
  console.log();

  // Frontend assets
  console.log(`${colors.blue}═══ Frontend Assets${colors.reset}`);
  allChecks &= directoryExists('frontend', 'Frontend directory');
  allChecks &= fileExists('frontend/index.html', 'Frontend entry point');
  allChecks &= fileExists('frontend/_redirects', 'API routing rules');
  console.log();

  // Backend structure
  console.log(`${colors.blue}═══ Backend Structure${colors.reset}`);
  allChecks &= directoryExists('app', 'FastAPI application');
  allChecks &= fileExists('app/main.py', 'FastAPI entry point');
  allChecks &= fileExists('requirements.txt', 'Python dependencies');
  console.log();

  // Docker (optional)
  console.log(`${colors.blue}═══ Docker (Optional)${colors.reset}`);
  try {
    execSync('docker --version', { encoding: 'utf8' });
    success('Docker: Installed');
    try {
      execSync('docker ps > /dev/null 2>&1', { encoding: 'utf8' });
      success('Docker: Running');
    } catch {
      warn('Docker: Not running - start with "docker-compose up"');
    }
  } catch {
    warn('Docker: Not installed - required for containerized deployment');
  }
  console.log();

  // Environment configuration
  console.log(`${colors.blue}═══ Environment Configuration${colors.reset}`);
  const envLocalExists = fs.existsSync(path.join(rootDir, '.env.local'));
  if (envLocalExists) {
    success('.env.local: Found');
  } else {
    warn('.env.local: Not found - copy from .env.local.example');
  }
  fileExists('.env.local.example', 'Environment template');
  console.log();

  // Summary
  console.log(`${colors.blue}═══ Summary${colors.reset}`);
  if (allChecks) {
    success('Build environment is properly configured!');
    console.log(`\nNext steps:`);
    console.log(`  1. Configure .env.local with your credentials`);
    console.log(`  2. Run "npm run dev" to start development`);
    console.log(`  3. Run "npm run deploy" to deploy frontend\n`);
    process.exit(0);
  } else {
    error('Some checks failed - please review the errors above');
    console.log(`\nSee BUILD_ENVIRONMENT.md for detailed setup instructions\n`);
    process.exit(1);
  }
}

// Run verification
verifyEnvironment().catch((err) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, err);
  process.exit(1);
});
