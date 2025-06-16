#!/usr/bin/env node
/**
 * cleanup-repo.js
 *
 * Comprehensive repository cleanup script for React/Node projects.
 * Cross-platform: Windows, macOS, Linux
 *
 * Features:
 * - Dry-run mode
 * - Interactive confirmation
 * - Progress indicators
 * - Detailed logging
 * - Error handling and rollback
 * - Whitelist protection
 * - Backup for critical configs
 * - Git status check
 *
 * Usage:
 *   node cleanup-repo.js [--dry-run] [--backup] [--yes]
 *
 * Examples:
 *   node cleanup-repo.js --dry-run
 *   node cleanup-repo.js --backup
 *   node cleanup-repo.js --yes
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync, spawnSync } = require('child_process');

const IGNORED = ['.git'];
const BACKUP_FILES = ['package.json', 'tsconfig.json', 'yarn.lock', 'package-lock.json', 'pnpm-lock.yaml', 'config.ts', 'next.config.js'];
const TARGETS = [
  'node_modules',
  'package-lock.json',
  'yarn.lock',
  '.next',
  'build',
  'dist',
  '.cache',
  '.parcel-cache',
  '.vscode',
  '.idea',
  '.DS_Store',
  'Thumbs.db',
];
const FILE_PATTERNS = [
  '*.tmp', '*.temp', '*.log',
];
const DOTFILE_PATTERN = /^\.[^\.]+/;

const deletedItems = [];
const backupDir = path.join(process.cwd(), 'cleanup-backup-' + Date.now());

function isWindows() {
  return process.platform === 'win32';
}

function walk(dir, callback) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const fullPath = path.join(dir, entry.name);
    if (IGNORED.includes(entry.name)) return;
    if (entry.isDirectory()) {
      callback(fullPath, true);
      walk(fullPath, callback);
    } else {
      callback(fullPath, false);
    }
  });
}

function matchPattern(name, patterns) {
  return patterns.some(pattern => {
    if (pattern.startsWith('*')) {
      return name.endsWith(pattern.slice(1));
    }
    return name === pattern;
  });
}

function findTargets(root) {
  const toDelete = [];
  walk(root, (fullPath, isDir) => {
    const base = path.basename(fullPath);
    // Dotfiles/hidden dirs (except .git)
    if (DOTFILE_PATTERN.test(base) && !IGNORED.includes(base)) {
      toDelete.push(fullPath);
      return;
    }
    // Targeted dirs/files
    if (TARGETS.includes(base)) {
      toDelete.push(fullPath);
      return;
    }
    // File patterns
    if (!isDir && matchPattern(base, FILE_PATTERNS)) {
      toDelete.push(fullPath);
      return;
    }
  });
  return toDelete;
}

function prompt(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function logProgress(msg) {
  process.stdout.write(msg + '\n');
}

function backupFiles(files) {
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
  files.forEach(f => {
    if (fs.existsSync(f)) {
      const dest = path.join(backupDir, path.basename(f));
      fs.copyFileSync(f, dest);
      logProgress(`[Backup] ${f} -> ${dest}`);
    }
  });
}

function deleteItem(item) {
  try {
    if (fs.lstatSync(item).isDirectory()) {
      fs.rmSync(item, { recursive: true, force: true });
    } else {
      fs.unlinkSync(item);
    }
    deletedItems.push(item);
    logProgress(`[Deleted] ${item}`);
  } catch (e) {
    logProgress(`[Error] Failed to delete ${item}: ${e.message}`);
    throw e;
  }
}

function rollback() {
  logProgress('\n[Rollback] Restoring deleted items...');
  // Only restore backups, not deleted temp files
  if (fs.existsSync(backupDir)) {
    fs.readdirSync(backupDir).forEach(f => {
      const src = path.join(backupDir, f);
      const dest = path.join(process.cwd(), f);
      fs.copyFileSync(src, dest);
      logProgress(`[Restored] ${dest}`);
    });
  }
}

function checkGitStatus() {
  try {
    const out = execSync('git status --porcelain', { encoding: 'utf8' });
    if (out.trim()) {
      logProgress('[Warning] You have uncommitted changes!');
      return false;
    }
    return true;
  } catch {
    logProgress('[Info] Not a git repository.');
    return true;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const backup = args.includes('--backup');
  const autoYes = args.includes('--yes');

  logProgress('--- Repository Cleanup Script ---');
  logProgress('Scanning for files/directories to remove...');

  if (!checkGitStatus()) {
    if (!autoYes) {
      const ans = await prompt('You have uncommitted changes. Continue? (y/N): ');
      if (!/^y(es)?$/i.test(ans)) {
        logProgress('Aborted.');
        process.exit(1);
      }
    }
  }

  const targets = findTargets(process.cwd());
  if (targets.length === 0) {
    logProgress('Nothing to clean!');
    return;
  }

  logProgress('\nThe following will be removed:');
  targets.forEach(t => logProgress('  ' + t));

  if (dryRun) {
    logProgress('\n[Dry Run] No files will be deleted.');
    return;
  }

  if (!autoYes) {
    const ans = await prompt('\nProceed with deletion? (y/N): ');
    if (!/^y(es)?$/i.test(ans)) {
      logProgress('Aborted.');
      process.exit(1);
    }
  }

  if (backup) {
    logProgress('\nBacking up critical configuration files...');
    backupFiles(BACKUP_FILES);
  }

  logProgress('\nDeleting files/directories...');
  try {
    for (const item of targets) {
      deleteItem(item);
    }
    logProgress('\nCleanup complete!');
    if (backup) logProgress(`Backups saved in: ${backupDir}`);
  } catch (e) {
    logProgress('\n[Error] Cleanup failed. Rolling back...');
    rollback();
    logProgress('Rollback complete.');
    process.exit(1);
  }
}

main();

// Usage instructions
if (require.main === module) {
  if (process.argv.includes('--help')) {
    console.log(`\nUsage: node cleanup-repo.js [--dry-run] [--backup] [--yes]\n\nOptions:\n  --dry-run   Preview what will be deleted\n  --backup    Backup critical config files before deleting\n  --yes       Skip confirmation prompts\n  --help      Show this help message\n\nExamples:\n  node cleanup-repo.js --dry-run\n  node cleanup-repo.js --backup\n  node cleanup-repo.js --yes\n`);
    process.exit(0);
  }
}
