import { build } from 'esbuild';
import { createRequire } from 'node:module';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

const debug = process.argv.includes('debug');

await build({
  bundle: true,
  entryPoints: {
    extension: require.resolve('../src/index.ts'),
    'language-server': require.resolve('@xstate/language-server'),
  },
  external: ['vscode'],
  logLevel: 'info',
  minify: !debug,
  outdir: fileURLToPath(new URL('../dist/', import.meta.url)),
  platform: 'node',
  sourcemap: debug,
  target: 'node16',
});
