const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const CONTENT_DIR = path.join(__dirname, 'content/news');
const OUTPUT_DIR = path.join(__dirname, 'public/news');
const TEMPLATE_HEADER = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}} | VAIZO</title>
  <meta name="description" content="{{DESC}}">
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <header class="header"><div class="header-inner"><div class="logo"><a href="/">VAIZO</a></div><button class="menu-toggle" aria-label="Menu">&#9776;</button><nav class="nav"><a href="/service/">SERVICE</a><a href="/about.html">ABOUT</a><a href="/case/">CASE</a><a href="/news/">NEWS</a><a href="/contact/" class="btn btn-primary btn-sm">CONTACT</a></nav></div></header>`;

const TEMPLATE_FOOTER = `
  <footer class="footer"><div class="container"><div class="footer-inner"><div><div class="footer-logo">VAIZO</div><p class="footer-desc">AIで、業務が前に進む会社へ。</p></div><div><div class="footer-heading">SERVICE</div><ul class="footer-links"><li><a href="/service/web.html">Web制作事業</a></li><li><a href="/service/ai-implementation.html">AI導入支援</a></li><li><a href="/service/ai-advisor.html">AI顧問</a></li><li><a href="/service/ai-education.html">AI教育支援</a></li></ul></div><div><div class="footer-heading">COMPANY</div><ul class="footer-links"><li><a href="/about.html">会社概要</a></li><li><a href="/case/">導入事例</a></li><li><a href="/news/">お知らせ</a></li></ul></div><div><div class="footer-heading">SUPPORT</div><ul class="footer-links"><li><a href="/contact/">お問い合わせ</a></li><li><a href="/privacy.html">プライバシーポリシー</a></li><li><a href="/legal.html">特定商取引法表記</a></li></ul></div></div><div class="footer-bottom"><span>&copy; 2026 VAIZO Inc.</span><span>AI BUSINESS TRANSFORMATION</span></div></div></footer>
  <script src="/main.js"></script>
</body>
</html>`;

const TAG_CLASSES = {
  PRESS: 'news-tag-press',
  SERVICE: 'news-tag-service',
  INFO: 'news-tag-info',
  COLUMN: 'news-tag-info'
};

const TAG_LABELS = {
  PRESS: 'PRESS',
  SERVICE: 'SERVICE',
  INFO: 'INFO',
  COLUMN: 'COLUMN'
};

function readArticles() {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs.readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const raw = fs.readFileSync(path.join(CONTENT_DIR, f), 'utf8');
      const { data, content } = matter(raw);
      return {
        ...data,
        slug: f.replace('.md', ''),
        body: content,
        html: marked(content)
      };
    })
    .filter(a => a.published !== false)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function buildArticlePage(article) {
  const dateStr = article.date.replace(/-/g, '.');
  const tagClass = TAG_CLASSES[article.category] || 'news-tag-info';
  const tagLabel = TAG_LABELS[article.category] || article.category;

  return TEMPLATE_HEADER
    .replace('{{TITLE}}', article.title)
    .replace('{{DESC}}', article.description || article.title) + `

  <section class="page-header">
    <div class="container">
      <p class="section-label">NEWS</p>
      <h1 style="font-size:28px;">${article.title}</h1>
      <p><span style="margin-right:12px;">${dateStr}</span><span class="news-tag ${tagClass}">${tagLabel}</span></p>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="legal-content">
        ${article.html}
      </div>
      <div style="margin-top:64px; padding-top:32px; border-top:1px solid #eee;">
        <a href="/news/" style="font-size:14px; color:#999;">&larr; お知らせ一覧に戻る</a>
      </div>
    </div>
  </section>` + TEMPLATE_FOOTER;
}

function buildIndexPage(articles) {
  const items = articles.map(a => {
    const dateStr = a.date.replace(/-/g, '.');
    const tagClass = TAG_CLASSES[a.category] || 'news-tag-info';
    const tagLabel = TAG_LABELS[a.category] || a.category;
    return `      <a href="/news/${a.slug}.html" class="news-item">
        <span class="news-date">${dateStr}</span>
        <span class="news-tag ${tagClass}">${tagLabel}</span>
        <span class="news-title">${a.title}</span>
      </a>`;
  }).join('\n');

  return TEMPLATE_HEADER
    .replace('{{TITLE}}', 'お知らせ')
    .replace('{{DESC}}', '株式会社VAIZOのニュース・お知らせ一覧。') + `

  <section class="page-header">
    <div class="container">
      <p class="section-label">NEWS</p>
      <h1>お知らせ</h1>
    </div>
  </section>

  <section class="section">
    <div class="container narrow">
${items}
    </div>
  </section>` + TEMPLATE_FOOTER;
}

// Build
const articles = readArticles();
console.log(`Found ${articles.length} articles`);

// Write index
fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), buildIndexPage(articles));
console.log('Built: /news/index.html');

// Write each article
articles.forEach(a => {
  fs.writeFileSync(path.join(OUTPUT_DIR, `${a.slug}.html`), buildArticlePage(a));
  console.log(`Built: /news/${a.slug}.html`);
});

console.log('News build complete!');
