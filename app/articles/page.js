import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import matter from 'gray-matter';

export const metadata = {
  title: 'Articles | House Planner',
  description: 'Read articles about budgeting, saving, and buying a home.',
};

async function getArticles() {
  const articlesDir = path.join(process.cwd(), 'content', 'articles');

  if (!fs.existsSync(articlesDir)) {
    return [];
  }

  const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));

  const articles = files.map(filename => {
    const filePath = path.join(articlesDir, filename);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(content);
    const slug = filename.replace('.md', '');

    return {
      slug,
      title: data.title || 'Untitled',
      date: data.date || '',
      author: data.author || '',
      description: data.description || '',
      image: data.image || '',
    };
  });

  return articles.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export default async function ArticlesPage() {
  const articles = await getArticles();

  return (
    <div>
      <h1>Articles</h1>
      <p className="subtitle">Tips, strategies, and insights about budgeting, saving for a down payment, and deciding whether to rent or buy.</p>

      {articles.length === 0 ? (
        <div className="writeup" style={{ textAlign: 'center', marginTop: '32px' }}>
          <p>No articles yet. Check back soon.</p>
        </div>
      ) : (
        <div className="articles-list">
          {articles.map(article => (
            <article key={article.slug} className="article-item">
              {article.image && (
                <img src={article.image} alt={article.title} style={{ maxWidth: '100%', height: 'auto', marginBottom: '16px', borderRadius: '6px' }} />
              )}
              <h2>
                <Link href={`/articles/${article.slug}`}>
                  {article.title}
                </Link>
              </h2>
              {(article.author || article.date) && (
                <p className="article-date">
                  {[article.author, article.date && new Date(article.date + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })].filter(Boolean).join(" · ")}
                </p>
              )}
              {article.description && <p>{article.description}</p>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
