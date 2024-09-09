import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './Firebase';
import { auth } from './Firebase';

Modal.setAppElement('#root');

const stripCategoryPrefix = (category) => category.replace('Category:', '').replace(/\s+/g, '_');

export const SuggestedCategoriesModal = ({ isOpen, onClose, userInventory, setSelectedCategories, selectedCategories }) => {
  const [suggestedCategories, setSuggestedCategories] = useState([]);
  const [recommendationType, setRecommendationType] = useState('inventory');
  const [wikipediaUsername, setWikipediaUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchWikipediaUsername();
    }
  }, [isOpen]);

  const fetchWikipediaUsername = async () => {
    const user = auth.currentUser;

    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setWikipediaUsername(userDoc.data().wikipediaUsername || '');
        }
      } catch (error) {
        console.error('Error fetching Wikipedia username:', error);
      }
    }
  };

  const fetchSuggestedCategories = async () => {
    setIsLoading(true);
    try {
      let payload;
      if (recommendationType === 'inventory') {
        payload = { articles: userInventory, recommendationType };
      } else {
        payload = { wikipediaUsername, recommendationType };
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/suggest_categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      console.log('Suggested categories:', data.categories);

      const strippedCategories = data.categories.map(stripCategoryPrefix);
      setSuggestedCategories(strippedCategories);
    } catch (error) {
      console.error('Error fetching suggested categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = (category) => {
    if (!selectedCategories.includes(category)) {
      setSelectedCategories([...selectedCategories, category]);
    } else {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} contentLabel="Suggested Categories">
      <h2>Suggested Categories</h2>
      <div>
        <label>
          <input
            type="radio"
            value="inventory"
            checked={recommendationType === 'inventory'}
            onChange={() => setRecommendationType('inventory')}
          />
          Based on Inventory
        </label>
        <label>
          <input
            type="radio"
            value="editHistory"
            checked={recommendationType === 'editHistory'}
            onChange={() => setRecommendationType('editHistory')}
          />
          Based on Wikipedia Edit History
        </label>
      </div>
      <button onClick={fetchSuggestedCategories} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Suggest Categories'}
      </button>
      {suggestedCategories.length > 0 ? (
        <ul>
          {suggestedCategories.map((category, index) => (
            <li key={index}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category)}
                  onChange={() => handleCategorySelect(category)}
                />
                {category}
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p>No suggestions available. Click "Suggest Categories" to get recommendations.</p>
      )}
      <button type="button" onClick={onClose}>Close</button>
    </Modal>
  );
};
