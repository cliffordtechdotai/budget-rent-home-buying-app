import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkHtml from 'remark-html';

async function getArticle(slug) {
  const filePath = path.join(process.cwd(), 'content', 'articles', `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  const processedContent = await remark()
    .use(remarkHtml)
    .process(content);

  return {
    slug,
    title: data.title || 'Untitled',
    date: data.date || '',
    description: data.description || '',
    image: data.image || '',
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

export async function generateMetadata({ params }) {
  const article = await getArticle(params.slug);

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
  const article = await getArticle(params.slug);

  if (!article) {
    return (
      <div>
        <h1>Article Not Found</h1>
        <p>Sorry, this article doesn't exist.</p>
      </div>
    );
  }

  return (
    <article>
      <div className="article-header">
        {article.image && (
          <img
            src={article.image}
            alt={article.title}
            style={{ maxWidth: '100%', height: 'auto', borderRadius: '6px', marginBottom: '24px' }}
          />
        )}
        <h1>{article.title}</h1>
        {article.date && (
          <div className="article-meta">
            {new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        )}
      </div>
      <div
        className="article-content"
        dangerouslySetInnerHTML={{ __html: article.content }}
        style={{ maxWidth: '800px', margin: '0 auto' }}
      />
    </article>
  );
}
