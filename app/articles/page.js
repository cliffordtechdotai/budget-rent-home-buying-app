import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import matter from 'gray-matter';

export const metadata = {
  title: 'Articles | House Planner',
  description: 'Plain-language guides to budgeting, saving a deposit, and deciding whether to rent or buy.',
};

// The sections articles get filed under, in the order they appear on the page.
export const CATEGORIES = [
  { key: 'basics', label: 'Start Here', blurb: 'What the terms mean and how the numbers fit together.' },
  { key: 'advice', label: 'Making Decisions', blurb: 'Working out what to do with the money you have.' },
  { key: 'renting', label: 'Renting', blurb: 'Staying put, and what it costs you or saves you.' },
  { key: 'buying', label: 'Buying', blurb: 'Deposits, mortgages, and the cost of owning.' },
];

// Guesses a category from the title and text when an article arrives without one,
// so a file dropped in with no category still lands somewhere sensible.
function inferCategory(title, body) {
  const text = (title + ' ' + body).toLowerCase();
  const score = {
    basics: /what is|explained|glossary|getting started|guide to|means|definition/.test(text) ? 2 : 0,
    advice: /should you|should i|worth it|better to|decide|choose|vs\.? |versus/.test(text) ? 2 : 0,
    renting: (text.match(/\brent(ing|al)?\b/g) || []).length,
    buying: (text.match(/\b(buy|buying|mortgage|deposit|down payment)\b/g) || []).length,
  };
  return Object.entries(score).sort((a, b) => b[1] - a[1])[0][1] > 0
    ? Object.entries(score).sort((a, b) => b[1] - a[1])[0][0]
    : 'basics';
}

async function getArticles() {
  const dir = path.join(process.cwd(), 'content', 'articles');
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(filename => {
      const { data, content } = matter(fs.readFileSync(path.join(dir, filename), 'utf-8'));
      const title = data.title || 'Untitled';
      const known = CATEGORIES.some(c => c.key === data.category);
      return {
        slug: filename.replace('.md', ''),
        title,
        date: data.date || '',
        author: data.author || '',
        description: data.description || '',
        category: known ? data.category : inferCategory(title, content),
        tags: Array.isArray(data.tags) ? data.tags : [],
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export default async function ArticlesPage() {
  const articles = await getArticles();

  return (
    <div className="article">
      <header className="article-header">
        <h1>Articles</h1>
        <p className="article-standfirst">
          Plain-language guides to budgeting, saving a deposit, and working out
          whether to rent or buy.
        </p>
      </header>

      {articles.length === 0 ? (
        <p className="hint" style={{ textAlign: 'center' }}>No articles yet.</p>
      ) : (
        CATEGORIES.map(cat => {
          const inCat = articles.filter(a => a.category === cat.key);
          if (inCat.length === 0) return null;
          return (
            <section key={cat.key} className="cat-section">
              <h2 className="cat-head">{cat.label}</h2>
              <p className="cat-blurb">{cat.blurb}</p>
              <div className="articles-list">
                {inCat.map(article => (
                  <article key={article.slug} className="article-item">
                    <h2>
                      <Link href={`/articles/${article.slug}`}>{article.title}</Link>
                    </h2>
                    {(article.author || article.date) && (
                      <p className="article-date">
                        {[
                          article.author,
                          article.date && new Date(article.date + 'T00:00:00')
                            .toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                        ].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {article.description && <p>{article.description}</p>}
                    {article.tags.length > 0 && (
                      <p className="tag-row">
                        {article.tags.map(t => <span key={t} className="tag">{t}</span>)}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
