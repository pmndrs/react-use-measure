import * as path from 'node:path'
import * as vite from 'vite'

export default vite.defineConfig({
  root: process.argv[2] ? undefined : 'demo',
  resolve: {
    alias: {
      'use-measure': path.resolve(__dirname, './src'),
    },
  },
  test: {
    browser: {
      provider: 'playwright',
      enabled: true,
      headless: true,
      screenshotFailures: false,
      instances: [{ browser: 'chromium' }],
    },
  },
  build: {
    target: 'es2018',
    sourcemap: true,
    lib: {
      formats: ['es', 'cjs'],
      entry: 'src/index.ts',
      fileName: '[name]',
    },
    rollupOptions: {
      external: (id: string) => !id.startsWith('.') && !path.isAbsolute(id),
      output: {
        sourcemapExcludeSources: true,
      },
    },
  },
  plugins: [
    {
      name: 'vite-tsc',
      generateBundle(options) {
        const ext = options.format === 'cjs' ? 'cts' : 'ts'
        this.emitFile({ type: 'asset', fileName: `index.d.${ext}`, source: `export * from '../src/index.ts'` })
      },
    },
    {
      name: 'vite-minify',
      renderChunk: {
        order: 'post',
        handler(code, { fileName }) {
          return vite.transformWithEsbuild(code, fileName, { minify: true, target: 'es2018' })
        },
      },
    },
  ],
})
