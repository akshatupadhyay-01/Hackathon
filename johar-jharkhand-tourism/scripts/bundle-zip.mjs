import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const rootDir = process.cwd();
const outputFileZip = path.join(rootDir, 'jharkhand-tourism-project.zip');
const outputMasterZip = path.join(rootDir, 'jharkhand-tourism-final-master.zip');
const projectFilesJsonPath = path.join(rootDir, 'src', 'data', 'project-files.json');

const ignoredDirs = new Set(['node_modules', 'dist', '.git', '.cache', '.npm']);
const ignoredFiles = new Set(['jharkhand-tourism-project.zip', 'jharkhand-tourism-final-master.zip', 'package-lock.json', '.DS_Store']);

function getAllFiles(dir, baseDir = '') {
  let results = [];
  const list = fs.readdirSync(dir);

  for (const file of list) {
    if (ignoredDirs.has(file) || ignoredFiles.has(file)) continue;

    const fullPath = path.join(dir, file);
    const relPath = path.join(baseDir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, relPath));
    } else {
      // Avoid bundling project-files.json into itself recursively if it grows too large
      if (relPath !== path.join('src', 'data', 'project-files.json')) {
        results.push({ fullPath, relPath: relPath.replace(/\\/g, '/') });
      }
    }
  }
  return results;
}

async function bundle() {
  console.log('Gathering project files for updated ZIP packaging...');
  const files = getAllFiles(rootDir);
  console.log(`Found ${files.length} project files.`);

  const fileMap = {};
  const zip = new JSZip();

  for (const { fullPath, relPath } of files) {
    const content = fs.readFileSync(fullPath, 'utf8');
    fileMap[relPath] = content;
    zip.file(relPath, fs.readFileSync(fullPath));
  }

  // Write updated project-files.json for browser client zip download
  fs.writeFileSync(projectFilesJsonPath, JSON.stringify(fileMap, null, 2), 'utf8');
  console.log(`Updated ${projectFilesJsonPath} with ${Object.keys(fileMap).length} files.`);

  // Generate ZIP buffers
  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  fs.writeFileSync(outputFileZip, zipBuffer);
  fs.writeFileSync(outputMasterZip, zipBuffer);

  const sizeMb = (zipBuffer.length / (1024 * 1024)).toFixed(2);
  console.log(`Successfully generated:\n- ${outputFileZip} (${sizeMb} MB)\n- ${outputMasterZip} (${sizeMb} MB)`);
}

bundle().catch((err) => {
  console.error('Error generating project ZIP:', err);
  process.exit(1);
});
