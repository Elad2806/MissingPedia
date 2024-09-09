import React, { useEffect, useState } from 'react';
import { createPlaceholderImage } from './utils';
import './dashboard.css';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './Firebase';

const Dashboard = ({ categories, articles, currentUser, userInventory, setUserInventory, distinctPagesCount }) => {
  const [articleImages, setArticleImages] = useState({});

  useEffect(() => {
    const fetchImages = async () => {
      const images = {};
      for (const article of articles) {
        try {
          const response = await fetch(
            `https://en.wikipedia.org/w/api.php?action=query&titles=${article.title}&prop=pageimages&piprop=thumbnail&pithumbsize=500&format=json&origin=*`
          );
          const data = await response.json();
          const page = Object.values(data.query.pages)[0];
          images[article.title] = page.thumbnail ? page.thumbnail.source : createPlaceholderImage();
        } catch (error) {
          images[article.title] = createPlaceholderImage();
        }
      }
      setArticleImages(images);
    };

    if (articles.length) {
      fetchImages();
    }
  }, [articles]);

  const categoriesList = categories.join(', ');

  const addToInventory = async (article) => {
    if (!currentUser) {
      alert("Please login to add articles to your inventory.");
      return;
    }
    if (!userInventory.some(item => item.page_id === article.page_id)) {
      const newInventory = [...userInventory, { id: article.page_id, title: article.title }];
      setUserInventory(newInventory);
      await setDoc(doc(db, 'users', currentUser.uid), { inventory: newInventory }, { merge: true });
    }
  };

  const removeFromInventory = async (article) => {
    const newInventory = userInventory.filter(item => item.page_id !== article.page_id);
    setUserInventory(newInventory);
    await setDoc(doc(db, 'users', currentUser.uid), { inventory: newInventory }, { merge: true });
  };

  return (
    <div id="result">
      <h2>
  Top Articles in: 
  {Array.isArray(categoriesList)
    ? categoriesList.join(', ').replace(/_/g, ' ')
    : categoriesList.replace(/_/g, ' ')}
</h2>
      <p className="scanned-pages-count">Number of scanned pages: {distinctPagesCount}</p>
      <ul id="articleList">
        {articles.map((article) => (
          <li key={article.pageid}>
            <img
              src={articleImages[article.title] || createPlaceholderImage()}
              alt={article.title}
              className="article-image"
            />
            <div className="article-content">
              <a
                href={`https://en.wikipedia.org/wiki/${article.title.replace(/ /g, '_')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="article-title"
              >
                {article.title.replace(/_/g, ' ')}
              </a>
              <div className="article-stats">
                <p>Content Length: {article.contentLength || 0} characters</p>
                <p>Views (last 30 days): {article.views || 0}</p>
                <p>Views/Content Ratio: {(article.len_views_ratio || 0).toFixed(4)}</p>
              </div>
              {userInventory.some(item => item.id === article.page_id) ? (
                <button className="inventoryBtn removeBtn" onClick={() => removeFromInventory(article)}>Remove from Inventory</button>
              ) : (
                <button className="inventoryBtn addBtn" onClick={() => addToInventory(article)}>Add to Inventory</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;