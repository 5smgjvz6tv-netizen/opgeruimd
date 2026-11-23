import { defineConfig } from 'vite'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: process.env.BASE ?? '/',
  plugins: [react(), {
    name: 'offline-round-shell',
    apply: 'build',
    writeBundle(options, bundle) {
      const file = resolve(options.dir!, 'sw.js')
      const shell = ['index.html', 'manifest.webmanifest', 'bas-rubber.webp', 'bas-rubber-192.png',
        'onboarding/roof.webp', 'onboarding/storey.webp', 'onboarding/ground.webp',
        ...Object.keys(bundle).filter(path => /\.(js|css)$/.test(path))]
      writeFileSync(file, readFileSync(file, 'utf8').replace('/* SHELL_FILES */ []', JSON.stringify(shell)))
    },
  }],
  server: { host: true },
})
