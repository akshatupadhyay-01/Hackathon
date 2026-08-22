import JSZip from 'jszip';
import projectFiles from '../data/project-files.json';

export async function downloadProjectZip() {
  const zip = new JSZip();

  // Add all source and config files to zip
  for (const [filePath, content] of Object.entries(projectFiles)) {
    // Avoid re-nesting if path starts with ./
    const cleanPath = filePath.replace(/^\.\//, '');
    zip.file(cleanPath, content as string);
  }

  // Generate zip file in browser as Blob
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  // Create temporary link and trigger instant browser download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'jharkhand-tourism-project.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
