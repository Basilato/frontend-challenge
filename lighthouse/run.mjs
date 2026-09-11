/**
 * Lighthouse audit runner. Serves the demo build, runs 3 measurements per
 * page × profile, and reports the median of each category.
 *
 *   pnpm build && pnpm preview   # in another shell, or rely on the spawn below
 *   pnpm audit:lighthouse
 *
 * Requires Node >= 22.19 (Lighthouse 13). Reports land in lighthouse/reports/.
 */
import { execFile } from 'node:child_process'
import { mkdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const BASE = process.env.LH_BASE_URL ?? 'http://localhost:4173'
const PAGES = { inicio: '/', detalhe: '/nft/nft_1' }
const PROFILES = ['mobile', 'desktop']
const RUNS = 3
const CATS = ['performance', 'accessibility', 'best-practices', 'seo']

// Invoke the local lighthouse CLI script directly with the current node binary
// instead of `npx lighthouse` — npx isn't reliably resolvable via execFile's
// PATH lookup on Windows (spawn ENOENT), and this also avoids an npx registry
// round-trip when the package is already a devDependency.
const lighthouseCli = fileURLToPath(new URL('../node_modules/lighthouse/cli/index.js', import.meta.url))

const median = (xs) => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)]

await mkdir(new URL('./reports/', import.meta.url), { recursive: true })

for (const [name, path] of Object.entries(PAGES)) {
  for (const profile of PROFILES) {
    const scores = Object.fromEntries(CATS.map((c) => [c, []]))
    for (let i = 1; i <= RUNS; i++) {
      const out = fileURLToPath(new URL(`./reports/${name}-${profile}-${i}`, import.meta.url))
      try {
        await run(process.execPath, [
          lighthouseCli,
          `${BASE}${path}`,
          profile === 'desktop' ? '--preset=desktop' : '--form-factor=mobile',
          '--quiet',
          '--chrome-flags=--headless=new',
          '--output=json',
          '--output=html',
          `--output-path=${out}`,
        ])
      } catch (err) {
        // On Windows, chrome-launcher can fail to delete its temp profile dir
        // after the audit has already run and written its report (AV/locking).
        // Don't fail the whole suite over that cleanup error — only over an
        // audit that genuinely produced no report.
        const reportExists = await readFile(`${out}.report.json`, 'utf8').catch(() => null)
        if (!reportExists) throw err
      }
      const report = JSON.parse(await readFile(`${out}.report.json`, 'utf8'))
      for (const c of CATS) scores[c].push(Math.round(report.categories[c].score * 100))
    }
    console.log(`\n${name} · ${profile}`)
    for (const c of CATS) console.log(`  ${c.padEnd(16)} median ${median(scores[c])}  (${scores[c].join(', ')})`)
  }
}
