import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const nextServerAppDir = path.join(rootDir, '.next', 'server', 'app');
const nextStaticDir = path.join(rootDir, '.next', 'static');
const publicDir = path.join(rootDir, 'public');

console.log('Preparing ./dist for Cloudflare Workers Assets...');

// Ensure dist directory exists
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 1. Copy index.html from .next/server/app/index.html
const sourceIndexHtml = path.join(nextServerAppDir, 'index.html');
if (fs.existsSync(sourceIndexHtml)) {
  fs.copyFileSync(sourceIndexHtml, path.join(distDir, 'index.html'));
  console.log('Copied index.html to dist/');
} else {
  console.error('Error: index.html not found in .next/server/app/');
}

// 2. Copy .next/static to dist/_next/static
const targetNextStatic = path.join(distDir, '_next', 'static');
fs.mkdirSync(path.join(distDir, '_next'), { recursive: true });
if (fs.existsSync(nextStaticDir)) {
  fs.cpSync(nextStaticDir, targetNextStatic, { recursive: true });
  console.log('Copied .next/static to dist/_next/static');
} else {
  console.error('Error: .next/static not found!');
}

// 3. Copy public assets into dist
if (fs.existsSync(publicDir)) {
  fs.cpSync(publicDir, distDir, { recursive: true });
  console.log('Copied public assets to dist/');
}

console.log('Done preparing dist directory!');
