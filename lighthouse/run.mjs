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
import { promisify } from 'node:util'

const run = promisify(execFile)
const BASE = process.env.LH_BASE_URL ?? 'http://localhost:4173'
const PAGES = { inicio: '/', detalhe: '/nft/nft_1' }
const PROFILES = ['mobile', 'desktop']
const RUNS = 3
const CATS = ['performance', 'accessibility', 'best-practices', 'seo']

const median = (xs) => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)]

await mkdir(new URL('./reports/', import.meta.url), { recursive: true })

for (const [name, path] of Object.entries(PAGES)) {
  for (const profile of PROFILES) {
    const scores = Object.fromEntries(CATS.map((c) => [c, []]))
    for (let i = 1; i <= RUNS; i++) {
      const out = new URL(`./reports/${name}-${profile}-${i}`, import.meta.url).pathname
      await run('npx', [
        'lighthouse',
        `${BASE}${path}`,
        profile === 'desktop' ? '--preset=desktop' : '--form-factor=mobile',
        '--quiet',
        '--chrome-flags=--headless=new',
        '--output=json',
        '--output=html',
        `--output-path=${out}`,
      ])
      const report = JSON.parse(await readFile(`${out}.report.json`, 'utf8'))
      for (const c of CATS) scores[c].push(Math.round(report.categories[c].score * 100))
    }
    console.log(`\n${name} · ${profile}`)
    for (const c of CATS) console.log(`  ${c.padEnd(16)} median ${median(scores[c])}  (${scores[c].join(', ')})`)
  }
}
