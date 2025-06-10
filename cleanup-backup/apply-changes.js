// apply-changes.js
const fs = require('fs');
const path = require('path');

// --- Configuration ---
const inputFile = 'goback.js';

// --- ANSI Colors for logging ---
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

const log = (color, message) => console.log(`${color}${message}${colors.reset}`);

/**
 * Main function to apply changes from the JSON file.
 */
function applyChanges() {
  log(colors.cyan, `\n🚀 Starting file update process from '${inputFile}'...`);

  // --- Safety Check ---
  if (!fs.existsSync(inputFile)) {
    log(colors.red, `❌ Error: Input file '${inputFile}' not found in the root directory.`);
    log(colors.yellow, `Please make sure you have saved the JSON output as '${inputFile}'.`);
    process.exit(1);
  }

  try {
    // --- Read and Parse the JSON file ---
    const fileContent = fs.readFileSync(inputFile, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!data.files || !Array.isArray(data.files)) {
      log(colors.red, `❌ Error: The file '${inputFile}' is not in the expected format. It must contain a 'files' array.`);
      process.exit(1);
    }
    
    const operations = data.files;
    log(colors.cyan, `Found ${operations.length} file operations to perform.`);
    console.log('---');

    // --- Process each file operation ---
    operations.forEach(fileOp => {
      const { filepath, content, operation } = fileOp;

      if (!filepath) {
        log(colors.yellow, `⚠️  Skipping an entry with a missing 'filepath'.`);
        return;
      }

      // Handle file deletion
      if (operation === 'delete') {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
          log(colors.red, `🗑️  DELETED: ${filepath}`);
        } else {
          log(colors.yellow, `🤷  SKIPPED (already deleted): ${filepath}`);
        }
      } 
      // Handle file creation/update
      else {
        try {
          const dir = path.dirname(filepath);
          // Create directory if it doesn't exist
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          // Write the file
          fs.writeFileSync(filepath, content || '', 'utf-8');
          log(colors.green, `✅ UPDATED/CREATED: ${filepath}`);
        } catch (writeError) {
          log(colors.red, `❌ ERROR writing file ${filepath}: ${writeError.message}`);
        }
      }
    });

    console.log('---');
    log(colors.cyan, '🎉 All file operations have been processed successfully!');

  } catch (error) {
    if (error instanceof SyntaxError) {
      log(colors.red, `❌ Error: Failed to parse '${inputFile}'. Please ensure it contains valid JSON.`);
    } else {
      log(colors.red, `❌ An unexpected error occurred: ${error.message}`);
    }
    process.exit(1);
  }
}

// --- Run the script ---
console.log('============================================');
console.log('         File Override Script');
console.log('============================================');
log(colors.yellow, '⚠️  WARNING: This script will overwrite and delete files in your project.');
log(colors.yellow, 'Please make sure you have backed up your work or committed your changes to git.');
console.log('============================================');

// Quick delay to make sure the user reads the warning
setTimeout(() => {
    applyChanges();
}, 2000);