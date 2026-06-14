import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tsxCli = path.join(rootDir, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const nodeOptions = process.env.NODE_OPTIONS ?? '';
const useSystemCa = '--use-system-ca';
const env = {
  ...process.env,
  NODE_OPTIONS: nodeOptions.includes(useSystemCa)
    ? nodeOptions
    : `${nodeOptions} ${useSystemCa}`.trim(),
};

const child = spawn(process.execPath, [tsxCli, ...process.argv.slice(2)], {
  cwd: rootDir,
  env,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
