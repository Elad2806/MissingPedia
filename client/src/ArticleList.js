import React from 'react';
import { createPlaceholderImage } from './utils';

export const ArticleList = ({ articles, onAddToInventory }) => {
  if (articles.length === 0) return null;

  return (
    <div id="result">
      <h2>Top Articles in: </h2>
      <ol id="articleList">
        {articles.map(article => (
          <li key={article.title}>
            <img 
              src={article.image || createPlaceholderImage()} 
              alt={article.title} 
              style={{ width: '100px', height: '100px', objectFit: 'cover' }}
            />
            <div className="article-info">
              <h3>
                <a href={article.url} target="_blank" rel="noopener noreferrer">
                  {/* Replace underscores with spaces */}
                  {article.title.replace(/_/g, ' ')}
                </a>
              </h3>
              <p>Content Length: {article.contentLength} characters</p>
              <p>Views: {article.views}</p>
              <p>Language Versions: {article.languageCount}</p>
              <button onClick={() => onAddToInventory(article)}>
                Add to Watchlist
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};