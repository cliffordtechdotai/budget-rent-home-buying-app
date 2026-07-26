'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ArticleList({ articles, tags }) {
  const [active, setActive] = useState('all');

  const shown = active === 'all'
    ? articles
    : articles.filter(a => a.tags.includes(active));

  return (
    <>
      <div className="tabbar" role="tablist">
        <button
          role="tab"
          aria-selected={active === 'all'}
          className={'tab' + (active === 'all' ? ' tab-on' : '')}
          onClick={() => setActive('all')}
        >
          All <span className="tab-n">{articles.length}</span>
        </button>
        {tags.map(t => {
          const n = articles.filter(a => a.tags.includes(t)).length;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={active === t}
              className={'tab' + (active === t ? ' tab-on' : '')}
              onClick={() => setActive(t)}
            >
              {t} <span className="tab-n">{n}</span>
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <p className="hint" style={{ textAlign: 'center', marginTop: '28px' }}>
          Nothing tagged {active} yet.
        </p>
      ) : (
        <div className="articles-list">
          {shown.map(article => (
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
                  {article.tags.map(t => (
                    // clicking a tag on a card jumps to that filter, same as the tab
                    <button key={t} className="tag tag-btn" onClick={() => setActive(t)}>
                      {t}
                    </button>
                  ))}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
