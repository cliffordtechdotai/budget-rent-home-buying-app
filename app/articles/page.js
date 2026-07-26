import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import ArticleList from './ArticleList';

export const metadata = {
  title: 'Articles | House Planner',
  description: 'Plain-language guides to budgeting, saving a deposit, and deciding whether to rent or buy.',
};

// The full tag vocabulary. Tags double as the categories here, so the list stays
// short on purpose. A test fails if an article uses anything outside it, which is
// what stops it drifting into thirty near-duplicate variations.
export const TAGS = [
  'definitions',
  'advice',
  'renting',
  'buying',
  'saving',
  'debt',
  'mortgages',
];

// Picks tags from the title and text when a file arrives without any, so an
// untagged draft still lands somewhere instead of being invisible.
function inferTags(title, body) {
  const text = (title + ' ' + body).toLowerCase();
  const hits = [];
  const count = re => (text.match(re) || []).length;

  if (/what is|explained|glossary|means|definition/.test(text)) hits.push('definitions');
  if (/should you|should i|worth it|better to|decide|versus/.test(text)) hits.push('advice');
  if (count(/\brent(ing|al)?\b/g) >= 3) hits.push('renting');
  if (count(/\b(buy|buying|purchase)\b/g) >= 3) hits.push('buying');
  if (count(/\b(save|saving|savings|deposit|down payment)\b/g) >= 3) hits.push('saving');
  if (count(/\bdebt\b/g) >= 3) hits.push('debt');
  if (count(/\bmortgage/g) >= 3) hits.push('mortgages');

  return hits.length ? hits : ['advice'];
}

function getArticles() {
  const dir = path.join(process.cwd(), 'content', 'articles');
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(filename => {
      const { data, content } = matter(fs.readFileSync(path.join(dir, filename), 'utf-8'));
      const title = data.title || 'Untitled';
      const given = Array.isArray(data.tags) ? data.tags.filter(t => TAGS.includes(t)) : [];
      return {
        slug: filename.replace('.md', ''),
        title,
        date: data.date || '',
        author: data.author || '',
        description: data.description || '',
        tags: given.length ? given : inferTags(title, content),
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export default function ArticlesPage() {
  const articles = getArticles();
  // only offer tabs for tags actually in use
  const used = TAGS.filter(t => articles.some(a => a.tags.includes(t)));

  return (
    <div className="article">
      <header className="article-header">
        <h1>Articles</h1>
        <p className="article-standfirst">
          Plain-language guides to budgeting, saving a deposit, and working out
          whether to rent or buy.
        </p>
      </header>

      {articles.length === 0
        ? <p className="hint" style={{ textAlign: 'center' }}>No articles yet.</p>
        : <ArticleList articles={articles} tags={used} />}
    </div>
  );
}
