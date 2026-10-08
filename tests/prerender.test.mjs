import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PUBLIC_PATHS, SITE_ORIGIN } from '../shared/routes.ts'
test('every public route has substantive initial HTML and unique metadata', async () => {
  const titles = new Set(), descriptions = new Set()
  for (const path of PUBLIC_PATHS) {
    const html = await readFile(`dist${path === '/' ? '' : path}/index.html`, 'utf8')
    assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1, path)
    assert.match(html, /<main[^>]*>[\s\S]{500,}<\/main>/)
    assert.match(html, /<a [^>]*href=/)
    assert.ok(html.includes(`<link rel="canonical" href="${SITE_ORIGIN}${path}"`), path)
    for (const key of ['title', 'description', 'url', 'image']) assert.ok(html.includes(`property="og:${key}"`), path)
    assert.match(html, /name="twitter:card" content="summary_large_image"/)
    assert.match(html, /<style data-styled=/)
    titles.add(html.match(/<title>(.*?)<\/title>/)[1])
    descriptions.add(html.match(/name="description" content="(.*?)"/)[1])
  }
  assert.equal(titles.size, PUBLIC_PATHS.length); assert.equal(descriptions.size, PUBLIC_PATHS.length)
})
test('sitemap contains exactly the public routes; robots and 404 are generated', async () => {
  const sitemap = await readFile('dist/sitemap.xml', 'utf8')
  assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]), PUBLIC_PATHS.map(path => SITE_ORIGIN + path))
  assert.match(await readFile('dist/robots.txt', 'utf8'), /Disallow: \/api\/\n\nSitemap: https:\/\/ilyakav.com\/sitemap.xml/)
  assert.match(await readFile('dist/404.html', 'utf8'), /name="robots" content="noindex,follow"/)
})
