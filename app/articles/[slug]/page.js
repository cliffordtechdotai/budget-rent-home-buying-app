import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkHtml from 'remark-html';
// Tables, strikethrough and bare-URL linking are GitHub extensions, not part of
// plain markdown. Without this a table renders as raw pipe characters.
import remarkGfm from 'remark-gfm';

async function getArticle(slug) {
  const filePath = path.join(process.cwd(), 'content', 'articles', `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  // sanitize:false keeps raw HTML you write in the markdown (for the odd embed);
  // everything here is authored by you, never submitted by a visitor.
  const processedContent = await remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .process(content);

  // Rough reading time so the reader knows what they're committing to.
  const words = content.trim().split(/\s+/).length;

  return {
    slug,
    title: data.title || 'Untitled',
    date: data.date || '',
    author: data.author || '',
    description: data.description || '',
    image: data.image || '',
    imageAlt: data.imageAlt || data.title || '',
    readingMinutes: Math.max(1, Math.round(words / 200)),
    content: processedContent.toString(),
  };
}

async function getArticleSlugs() {
  const articlesDir = path.join(process.cwd(), 'content', 'articles');

  if (!fs.existsSync(articlesDir)) {
    return [];
  }

  return fs.readdirSync(articlesDir)
    .filter(f => f.endsWith('.md'))
    .map(f => ({ slug: f.replace('.md', '') }));
}

export async function generateStaticParams() {
  const params = await getArticleSlugs();
  return params;
}

// Next.js 15+ hands `params` in as a promise, so it has to be awaited. Reading
// params.slug directly gave undefined, which made every article 404.
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return {
      title: 'Article Not Found',
      description: 'This article does not exist.',
    };
  }

  return {
    title: `${article.title} | House Planner`,
    description: article.description || article.title,
    image: article.image || undefined,
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return (
      <div>
        <h1>Article Not Found</h1>
        <p>Sorry, this article doesn't exist.</p>
      </div>
    );
  }

  // byline: author, date and reading time, whichever of them exist
  const byline = [
    article.author,
    article.date && new Date(article.date + 'T00:00:00').toLocaleDateString('en-US',
      { year: 'numeric', month: 'long', day: 'numeric' }),
    `${article.readingMinutes} min read`,
  ].filter(Boolean);

  return (
    <article className="article">
      <header className="article-header">
        <h1>{article.title}</h1>
        {byline.length > 0 && <div className="article-meta">{byline.join(' · ')}</div>}
        {article.description && <p className="article-standfirst">{article.description}</p>}
      </header>

      {article.image && (
        <img className="article-hero" src={article.image} alt={article.imageAlt} />
      )}

      <div
        className="article-content"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      <footer className="article-footer">
        <a href="/articles">&larr; All articles</a>
      </footer>
    </article>
  );
}
