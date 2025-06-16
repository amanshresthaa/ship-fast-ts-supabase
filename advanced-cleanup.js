#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class RepoCleanup {
  constructor() {
    this.rootDir = process.cwd();
    this.deletedFiles = [];
    this.deletedDirs = [];
    this.errors = [];
    this.dryRun = process.argv.includes('--dry-run');
    this.verbose = process.argv.includes('--verbose');
    this.force = process.argv.includes('--force');
    
    // Files and directories to remove
    this.filesToRemove = [
      // Documentation files (keep only essential ones)
      'BUILD_FIX_SUMMARY.md',
      'CLEANUP_SUMMARY.md',
      'DATABASE_ENHANCEMENTS.md',
      'DEPLOYMENT_CHECKLIST.md',
      'GUide.md',
      'MIGRATION_COMPLETION_REPORT.md',
      'PERFORMANCE.md',
      'README_NEW.md',
      'README_OLD.md',
      'RESPONSIVE_CHANGES_SUMMARY.md',
      'VERCEL_DEPLOYMENT.md',
      'drag_and_drop_fix.md',
      'dropdownguide.md',
      'routing-spike.md',
      
      // Temporary and backup files
      'cognitive_quiz_code_20250605_164936.json',
      'cognitive_quiz_code_20250605_164936.md',
      'collect_code_for_llm.py',
      'requirements.txt',
      
      // Old scripts
      'fix-deps.sh',
      'quick-start.sh',
      'setup.sh',
      
      // Build artifacts
      'tsconfig.tsbuildinfo',
      '.DS_Store',
      'Thumbs.db',
      'desktop.ini',
    ];
    
    this.directoriesToRemove = [
      // Backup and temporary directories
      'cleanup-backup',
      'logs',
      'temp',
      'migration',
      'output-quiz-updated',
      'uploads',
      
      // Build and cache directories
      '.next',
      'node_modules',
      'dist',
      'build',
      '.cache',
      'coverage',
      'test-results',
      'playwright-report',
      
      // IDE and OS directories
      '.vscode',
      '.idea',
      '__pycache__',
      '*.egg-info',
    ];
    
    // File patterns to remove
    this.filePatterns = [
      /\.log$/,
      /\.tmp$/,
      /\.temp$/,
      /\.bak$/,
      /\.backup$/,
      /\.old$/,
      /\.orig$/,
      /\.swp$/,
      /\.swo$/,
      /~$/,
      /\.DS_Store$/,
      /Thumbs\.db$/,
      /desktop\.ini$/,
      /\.pyc$/,
      /\.pyo$/,
      /\.pyd$/,
      /\.so$/,
      /\.egg$/,
      /\.egg-info$/,
    ];
    
    // Directories to clean up (remove files matching patterns)
    this.dirsToClean = [
      'app',
      'components',
      'lib',
      'hooks',
      'types',
      'scripts',
      'database',
      'supabase',
      '__tests__',
      '__mocks__',
      'tests',
      'docs',
      'public',
    ];
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = this.dryRun ? '[DRY RUN] ' : '';
    
    switch (level) {
      case 'error':
        console.error(`${prefix}❌ [${timestamp}] ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix}⚠️  [${timestamp}] ${message}`);
        break;
      case 'success':
        console.log(`${prefix}✅ [${timestamp}] ${message}`);
        break;
      case 'info':
      default:
        if (this.verbose) {
          console.log(`${prefix}ℹ️  [${timestamp}] ${message}`);
        }
        break;
    }
  }

  checkGitStatus() {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim() && !this.force) {
        this.log('Warning: You have uncommitted changes!', 'warn');
        this.log('Use --force to proceed anyway, or commit your changes first.', 'warn');
        if (!this.dryRun) {
          process.exit(1);
        }
      }
    } catch (error) {
      this.log('Not a git repository or git not available', 'warn');
    }
  }

  safeDelete(itemPath, isDirectory = false) {
    if (this.dryRun) {
      this.log(`Would delete: ${itemPath}`, 'info');
      return true;
    }

    try {
      if (isDirectory) {
        fs.rmSync(itemPath, { recursive: true, force: true });
        this.deletedDirs.push(itemPath);
        this.log(`Deleted directory: ${itemPath}`, 'success');
      } else {
        fs.unlinkSync(itemPath);
        this.deletedFiles.push(itemPath);
        this.log(`Deleted file: ${itemPath}`, 'success');
      }
      return true;
    } catch (error) {
      this.errors.push({ path: itemPath, error: error.message });
      this.log(`Failed to delete ${itemPath}: ${error.message}`, 'error');
      return false;
    }
  }

  cleanupFiles() {
    this.log('Cleaning up specific files...', 'info');
    
    for (const file of this.filesToRemove) {
      const filePath = path.join(this.rootDir, file);
      if (fs.existsSync(filePath)) {
        this.safeDelete(filePath, false);
      }
    }
  }

  cleanupDirectories() {
    this.log('Cleaning up directories...', 'info');
    
    for (const dir of this.directoriesToRemove) {
      const dirPath = path.join(this.rootDir, dir);
      if (fs.existsSync(dirPath)) {
        this.safeDelete(dirPath, true);
      }
    }
  }

  cleanupByPatterns() {
    this.log('Cleaning up files by patterns...', 'info');
    
    const scanDirectory = (dirPath) => {
      try {
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stats = fs.statSync(itemPath);
          
          if (stats.isFile()) {
            // Check if file matches any pattern
            const shouldDelete = this.filePatterns.some(pattern => pattern.test(item));
            if (shouldDelete) {
              this.safeDelete(itemPath, false);
            }
          } else if (stats.isDirectory() && !item.startsWith('.git')) {
            // Recursively scan subdirectories (avoid .git)
            scanDirectory(itemPath);
          }
        }
      } catch (error) {
        this.log(`Error scanning directory ${dirPath}: ${error.message}`, 'error');
      }
    };

    // Scan specific directories
    for (const dir of this.dirsToClean) {
      const dirPath = path.join(this.rootDir, dir);
      if (fs.existsSync(dirPath)) {
        scanDirectory(dirPath);
      }
    }
  }

  cleanupEmptyDirectories() {
    this.log('Removing empty directories...', 'info');
    
    const removeEmptyDirs = (dirPath) => {
      try {
        const items = fs.readdirSync(dirPath);
        
        // First, recursively clean subdirectories
        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stats = fs.statSync(itemPath);
          
          if (stats.isDirectory() && !item.startsWith('.git')) {
            removeEmptyDirs(itemPath);
          }
        }
        
        // Check if directory is now empty
        const currentItems = fs.readdirSync(dirPath);
        if (currentItems.length === 0) {
          // Don't delete essential directories
          const essentialDirs = ['app', 'components', 'lib', 'public', 'supabase'];
          const dirName = path.basename(dirPath);
          
          if (!essentialDirs.includes(dirName)) {
            this.safeDelete(dirPath, true);
          }
        }
      } catch (error) {
        this.log(`Error cleaning empty directories in ${dirPath}: ${error.message}`, 'error');
      }
    };

    removeEmptyDirs(this.rootDir);
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      mode: this.dryRun ? 'DRY RUN' : 'EXECUTION',
      summary: {
        filesDeleted: this.deletedFiles.length,
        directoriesDeleted: this.deletedDirs.length,
        errors: this.errors.length
      },
      deletedFiles: this.deletedFiles,
      deletedDirectories: this.deletedDirs,
      errors: this.errors
    };

    if (!this.dryRun) {
      fs.writeFileSync(
        path.join(this.rootDir, 'cleanup-report.json'), 
        JSON.stringify(report, null, 2)
      );
    }

    return report;
  }

  printSummary(report) {
    console.log('\n' + '='.repeat(50));
    console.log('CLEANUP SUMMARY');
    console.log('='.repeat(50));
    console.log(`Mode: ${report.mode}`);
    console.log(`Files deleted: ${report.summary.filesDeleted}`);
    console.log(`Directories deleted: ${report.summary.directoriesDeleted}`);
    console.log(`Errors: ${report.summary.errors}`);
    
    if (report.errors.length > 0) {
      console.log('\nErrors encountered:');
      report.errors.forEach(error => {
        console.log(`  - ${error.path}: ${error.error}`);
      });
    }
    
    if (!this.dryRun && (report.summary.filesDeleted > 0 || report.summary.directoriesDeleted > 0)) {
      console.log('\n✅ Cleanup completed successfully!');
      console.log('📋 Detailed report saved to: cleanup-report.json');
    } else if (this.dryRun) {
      console.log('\n📋 This was a dry run. Use without --dry-run to actually delete files.');
    }
  }

  run() {
    console.log('🧹 Repository Cleanup Tool');
    console.log('='.repeat(30));
    
    if (this.dryRun) {
      console.log('🔍 Running in DRY RUN mode - no files will be deleted');
    }
    
    console.log('');

    // Check git status
    this.checkGitStatus();

    // Perform cleanup operations
    this.cleanupFiles();
    this.cleanupDirectories();
    this.cleanupByPatterns();
    this.cleanupEmptyDirectories();

    // Generate and display report
    const report = this.generateReport();
    this.printSummary(report);
  }
}

// Show help
function showHelp() {
  console.log(`
Repository Cleanup Tool

Usage: node advanced-cleanup.js [options]

Options:
  --dry-run     Show what would be deleted without actually deleting
  --verbose     Show detailed logging
  --force       Proceed even with uncommitted git changes
  --help        Show this help message

Examples:
  node advanced-cleanup.js --dry-run          # Preview what will be deleted
  node advanced-cleanup.js --verbose          # Clean with detailed logging
  node advanced-cleanup.js --force            # Clean even with uncommitted changes
  `);
}

// Main execution
if (process.argv.includes('--help')) {
  showHelp();
  process.exit(0);
}

const cleanup = new RepoCleanup();
cleanup.run();
