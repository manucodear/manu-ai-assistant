const fs = require('fs');
const path = require('path');

const SITE_URL = (process.env.SITE_URL || 'https://example.com').replace(/\/$/, '');
const OUT_DIR = path.join(process.cwd(), 'dist');

const pages = ['/', '/privacy', '/terms'];

function buildSitemap() {
  const now = new Date().toISOString();
  const urlset = pages
    .map((p) => {
      const loc = `${SITE_URL}${p}`;
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlset}\n</urlset>`;

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const sitemapPath = path.join(OUT_DIR, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, xml, { encoding: 'utf8' });
  console.log('Wrote', sitemapPath);

  const robots = `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`;
  const robotsPath = path.join(OUT_DIR, 'robots.txt');
  fs.writeFileSync(robotsPath, robots, { encoding: 'utf8' });
  console.log('Wrote', robotsPath);
}

try {
  buildSitemap();
} catch (err) {
  console.error('Failed to generate sitemap/robots:', err);
  process.exit(1);
}
