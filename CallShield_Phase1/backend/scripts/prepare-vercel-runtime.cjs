// Run after compilation. Keep only the API's runtime dependency graph so Vercel
// can include dynamic NestJS loads without shipping the development toolchain.
const fs = require('node:fs');
const path = require('node:path');
const base = path.resolve(__dirname, '..');
const modules = path.join(base, 'node_modules');
const runtimeRoots = [
  '@nestjs/common', '@nestjs/core', '@nestjs/config',
  '@nestjs/platform-express', '@prisma/client', 'class-transformer',
  'class-validator', 'helmet', 'reflect-metadata', 'rxjs',
  // Vercel type-checks its TypeScript entrypoint after this build step.
  '@types/node', 'typescript',
];
const keep = new Set();
function visit(name, from = base) {
  let directory = from;
  let manifest;
  while (true) {
    const candidate = path.join(directory, 'node_modules', name, 'package.json');
    if (fs.existsSync(candidate)) { manifest = candidate; break; }
    const parent = path.dirname(directory);
    if (parent === directory) return;
    directory = parent;
  }
  const folder = path.dirname(manifest);
  if (keep.has(folder)) return;
  keep.add(folder);
  const pkg = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  for (const dependency of Object.keys({ ...pkg.dependencies, ...pkg.optionalDependencies })) {
    visit(dependency, folder);
  }
}
runtimeRoots.forEach(name => visit(name));
const retained = folder => [...keep].some(item => item === folder || item.startsWith(folder + path.sep));
for (const entry of fs.readdirSync(modules)) {
  if (entry === '.prisma') continue;
  const folder = path.join(modules, entry);
  if (entry.startsWith('@')) {
    for (const name of fs.readdirSync(folder)) {
      const scoped = path.join(folder, name);
      if (!retained(scoped)) fs.rmSync(scoped, { recursive: true, force: true });
    }
  } else if (!retained(folder)) {
    fs.rmSync(folder, { recursive: true, force: true });
  }
}
console.log(`Prepared ${keep.size} runtime packages for Vercel.`);
