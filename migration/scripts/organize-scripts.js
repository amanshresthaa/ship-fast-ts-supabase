#!/usr/bin/env node
/**
 * Scripts Folder Cleanup
 * Organizes remaining files in scripts/ folder
 */

const fs = require('fs-extra');
const path = require('path');

const projectRoot = '/Users/amankumarshrestha/Downloads/ship-fast-ts-supabase';
const scriptsDir = path.join(projectRoot, 'scripts');

async function organizeScriptsFolder() {
  console.log('📂 Organizing scripts/ folder...\n');
  
  const files = await fs.readdir(scriptsDir);
  
  console.log('📋 Current files in scripts/:');
  for (const file of files) {
    const filePath = path.join(scriptsDir, file);
    const stats = await fs.stat(filePath);
    console.log(`📄 ${file} (${stats.size} bytes)`);
  }
  
  // Create subdirectories for organization
  const testDir = path.join(scriptsDir, 'tests');
  const deployDir = path.join(scriptsDir, 'deployment');
  
  await fs.ensureDir(testDir);
  await fs.ensureDir(deployDir);
  
  console.log('\n🗂️  Organizing files:');
  
  // Move test files
  const testFiles = files.filter(file => file.includes('test') || file.includes('Test'));
  for (const file of testFiles) {
    const sourcePath = path.join(scriptsDir, file);
    const targetPath = path.join(testDir, file);
    await fs.move(sourcePath, targetPath);
    console.log(`📁 Moved to tests/: ${file}`);
  }
  
  // Move deployment files
  const deployFiles = files.filter(file => file.includes('deploy') || file.endsWith('.sh'));
  for (const file of deployFiles) {
    const sourcePath = path.join(scriptsDir, file);
    const targetPath = path.join(deployDir, file);
    await fs.move(sourcePath, targetPath);
    console.log(`🚀 Moved to deployment/: ${file}`);
  }
  
  console.log('\n✅ Scripts folder organized!');
  
  // Show final structure
  console.log('\n📁 Final scripts/ structure:');
  const finalFiles = await fs.readdir(scriptsDir);
  for (const item of finalFiles) {
    const itemPath = path.join(scriptsDir, item);
    const isDir = (await fs.stat(itemPath)).isDirectory();
    if (isDir) {
      console.log(`📂 ${item}/`);
      const subFiles = await fs.readdir(itemPath);
      subFiles.forEach(subFile => console.log(`  📄 ${subFile}`));
    } else {
      console.log(`📄 ${item}`);
    }
  }
}

async function main() {
  try {
    await organizeScriptsFolder();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

if (require.main === module) {
  main();
}
