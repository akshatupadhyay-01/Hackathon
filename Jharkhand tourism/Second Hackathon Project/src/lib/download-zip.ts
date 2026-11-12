import JSZip from 'jszip';

/**
 * Source snapshot of the application, collected at build time by Vite.
 * Replaces the previously missing `data/project-files.json` artifact so the
 * "Download source" action works without a pre-generated bundle file.
 */
const sourceModules = import.meta.glob('/src/**/*.{ts,tsx,css}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const rootModules = import.meta.glob('/{index.html,package.json,tsconfig.json,vite.config.ts,README.md}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const sqlModules = import.meta.glob('/db/*.sql', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export async function downloadProjectZip() {
  const zip = new JSZip();

  const allFiles: Record<string, string> = {
    ...sourceModules,
    ...rootModules,
    ...sqlModules,
  };

  for (const [filePath, content] of Object.entries(allFiles)) {
    const cleanPath = filePath.replace(/^\//, '').replace(/^\.\//, '');
    zip.file(cleanPath, content);
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'jharkhand-tourism-project.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
