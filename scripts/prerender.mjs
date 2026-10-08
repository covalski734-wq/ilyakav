import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { render, PUBLIC_PATHS, SITE_ORIGIN } from '../.ssg/entry-server.js'
const template = await readFile('dist/index.html', 'utf8')
const escape = text => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
for (const path of [...PUBLIC_PATHS, '/404']) {
  const { html, styles, meta } = await render(path)
  const tags = [
    `<title>${escape(meta.title)}</title>`,
    `<link rel="canonical" href="${escape(meta.canonical)}" />`,
    ...Object.entries({ description: meta.description, robots: meta.indexable ? 'index,follow' : 'noindex,follow', 'twitter:card': 'summary_large_image', 'twitter:title': meta.title, 'twitter:description': meta.description, 'twitter:image': meta.image }).map(([key, value]) => `<meta name="${key}" content="${escape(value)}" />`),
    ...Object.entries({ title: meta.title, description: meta.description, url: meta.canonical, image: meta.image, type: 'website' }).map(([key, value]) => `<meta property="og:${key}" content="${escape(value)}" />`),
    styles,
  ].join('\n')
  const output = template.replace(/<title>[\s\S]*?<\/title>/, '').replace(/<meta\s+name="description"[\s\S]*?\/>/, '').replace('</head>', () => tags + '\n</head>').replace('<div id="root"></div>', () => `<div id="root">${html}</div>`)
  const target = path === '/404' ? 'dist/404.html' : `dist${path === '/' ? '' : path}/index.html`
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, output)
}
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`)
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${PUBLIC_PATHS.map(path => `  <url><loc>${SITE_ORIGIN}${path}</loc></url>`).join('\n')}\n</urlset>\n`)
console.log(`Prerendered ${PUBLIC_PATHS.length} pages and 404; generated robots.txt and sitemap.xml`)
