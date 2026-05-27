/**
 * Catalog contract tests for the Runneth Use Case Library.
 *
 * These mirror exactly how the site reads this repo (use-case-library-site/
 * server/src/github.ts), so if they pass, every shown card renders. Run by CI
 * on every PR — see .github/workflows/validate-catalog.yml.
 *
 *   node --test scripts/validate-catalog.mjs
 *
 * No dependencies — Node's built-in test runner only.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const abs = (p) => resolve(ROOT, p)
const readJSON = (p) => JSON.parse(readFileSync(abs(p), 'utf8'))
const gitFiles = (pattern = '') =>
  execSync(`git ls-files ${pattern}`, { cwd: ROOT }).toString().trim().split('\n').filter(Boolean)

const catalog = readJSON('.use-case-library/catalog.json')
const categories = readJSON('.use-case-library/categories.json')
const categorySlugs = new Set(categories.map((c) => c.slug))
const excluded = catalog.excluded ?? []

// Mirror the site's slug → folder resolution (github.ts: discoverSlugPath).
const resolveSlug = (slug) =>
  [slug, `landing-page-bundle/${slug}`].find((c) => existsSync(abs(`${c}/use-case.json`))) ?? null

test('catalog.json has a non-empty slugs array', () => {
  assert.ok(Array.isArray(catalog.slugs) && catalog.slugs.length > 0, 'catalog.slugs must be a non-empty array')
})

test('categories.json entries have slug, title, numeric order, blurb — and unique slugs', () => {
  assert.ok(Array.isArray(categories) && categories.length > 0)
  const seen = new Set()
  for (const c of categories) {
    assert.ok(
      c.slug && c.title && typeof c.order === 'number' && c.blurb?.trim(),
      `malformed category (needs slug, title, order, blurb): ${JSON.stringify(c)}`,
    )
    assert.ok(!seen.has(c.slug), `duplicate category slug: ${c.slug}`)
    seen.add(c.slug)
  }
})

test('every shown slug resolves to a use-case.json (no silent 404s on the site)', () => {
  const missing = catalog.slugs.filter((s) => !resolveSlug(s))
  assert.deepEqual(missing, [], `slugs with no use-case.json: ${missing.join(', ')}`)
})

test('every shown use-case.json matches the schema the site reads', () => {
  for (const slug of catalog.slugs) {
    const uc = readJSON(`${resolveSlug(slug)}/use-case.json`)
    assert.equal(uc.slug, slug, `${slug}: use-case.json slug is "${uc.slug}"`)
    assert.ok(uc.display_title?.trim(), `${slug}: empty display_title`)
    assert.ok(uc.pitch?.trim(), `${slug}: empty pitch`)
    assert.ok(['proven', 'experimental'].includes(uc.status), `${slug}: status "${uc.status}" is not proven|experimental`)
    assert.ok(categorySlugs.has(uc.category), `${slug}: category "${uc.category}" is not in categories.json`)
  }
})

test('excluded entries each have a slug and a reason', () => {
  for (const e of excluded) {
    assert.ok(e.slug && e.reason?.trim(), `excluded entry needs slug + reason: ${JSON.stringify(e)}`)
  }
})

test('no slug is both shown and excluded', () => {
  const ex = new Set(excluded.map((e) => e.slug))
  const dup = catalog.slugs.filter((s) => ex.has(s))
  assert.deepEqual(dup, [], `in both slugs and excluded: ${dup.join(', ')}`)
})

test('every built use case is accounted for in the catalog (no orphans)', () => {
  const known = new Set([...catalog.slugs, ...excluded.map((e) => e.slug)])
  const orphans = gitFiles("'*use-case.json'")
    .map((f) => readJSON(f).slug)
    .filter((s) => !known.has(s))
  assert.deepEqual(orphans, [], `built but missing from catalog (add to slugs or excluded): ${orphans.join(', ')}`)
})

test('every use-case.json slug matches its directory name', () => {
  const bad = gitFiles("'*use-case.json'")
    .map((f) => ({ f, slug: readJSON(f).slug, dir: f.split('/').at(-2) }))
    .filter(({ slug, dir }) => slug !== dir)
    .map(({ f, slug, dir }) => `${f}: slug "${slug}" != dir "${dir}"`)
  assert.deepEqual(bad, [], `slug/dir mismatches: ${bad.join('; ')}`)
})

test('no slug resolves at both <slug>/ and landing-page-bundle/<slug>/ (ambiguous)', () => {
  const ambiguous = catalog.slugs.filter(
    (s) => existsSync(abs(`${s}/use-case.json`)) && existsSync(abs(`landing-page-bundle/${s}/use-case.json`)),
  )
  assert.deepEqual(ambiguous, [], `slug resolves at two paths: ${ambiguous.join(', ')}`)
})

test('no build artifacts are committed', () => {
  const bad = gitFiles().filter((f) => /\.(zip|tar\.gz|tgz)$/.test(f) || /(^|\/)_tmp_/.test(f))
  assert.deepEqual(bad, [], `committed build artifacts (use git tags/releases instead): ${bad.join(', ')}`)
})

test('card titles and pitches contain no em-dash (flagged as an AI tell)', () => {
  const bad = []
  for (const slug of catalog.slugs) {
    const uc = readJSON(`${resolveSlug(slug)}/use-case.json`)
    if (uc.display_title?.includes('—') || uc.pitch?.includes('—')) bad.push(slug)
  }
  assert.deepEqual(bad, [], `em-dash in card copy: ${bad.join(', ')}`)
})
