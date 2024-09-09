import React, { useState, useEffect } from 'react';
import { getSubcategories } from './utils';

export const CategoryModal = ({ isOpen, onClose, selectedCategories, setSelectedCategories, wikipediaCategories, categoryGroups }) => {
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    if (isOpen) {
      setExpandedCategories({});
    }
  }, [isOpen]);

  const stripCategoryPrefix = (category) => category.replace('Category:', '');
  const addCategoryPrefix = (category) => `Category:${category}`;
  const toUnderscore = (category) => category.replace(/\s+/g, '_');
  const toSpaces = (category) => category.replace(/_/g, ' ');

  const toggleCategory = (category) => {
    const strippedCategory = stripCategoryPrefix(wikipediaCategories[category]);
    const underscoredCategory = toUnderscore(strippedCategory);
    setSelectedCategories(prev =>
      prev.includes(underscoredCategory)
        ? prev.filter(c => c !== underscoredCategory)
        : [...prev, underscoredCategory]
    );
  };

  const toggleAllInGroup = (group) => {
    const groupCategories = categoryGroups[group].map(cat => toUnderscore(stripCategoryPrefix(wikipediaCategories[cat])));
    const allSelected = groupCategories.every(cat => selectedCategories.includes(cat));

    if (allSelected) {
      setSelectedCategories(prev => prev.filter(c => !groupCategories.includes(c)));
    } else {
      setSelectedCategories(prev => {
        return [...new Set([...prev, ...groupCategories])];
      });
    }
  };

  const toggleSubcategory = (subcategory) => {
    const strippedSubcategory = stripCategoryPrefix(subcategory);
    const underscoredSubcategory = toUnderscore(strippedSubcategory);
    setSelectedCategories(prev =>
      prev.includes(underscoredSubcategory)
        ? prev.filter(c => c !== underscoredSubcategory)
        : [...prev, underscoredSubcategory]
    );
  };

  const loadSubcategories = async (category) => {
    const categoryName = wikipediaCategories[category] || category;
    const strippedCategoryName = stripCategoryPrefix(categoryName);
    if (expandedCategories[strippedCategoryName]) {
      setExpandedCategories(prev => ({ ...prev, [strippedCategoryName]: null }));
    } else {
      const fullCategoryName = addCategoryPrefix(strippedCategoryName);
      const subcategories = await getSubcategories(fullCategoryName);
      setExpandedCategories(prev => ({ ...prev, [strippedCategoryName]: subcategories }));
    }
  };

  const renderSubcategories = (subcategories, level = 1) => {
    return subcategories.map(subcat => {
      const strippedSubcat = stripCategoryPrefix(subcat);
      const underscoredSubcat = toUnderscore(strippedSubcat);
      return (
        <div key={underscoredSubcat} className="subcategory-item" style={{ paddingLeft: `${level * 20}px` }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              className="subcategory-checkbox"
              checked={selectedCategories.includes(underscoredSubcat)}
              onChange={() => toggleSubcategory(subcat)}
            />
            <label>{toSpaces(strippedSubcat)}</label>
            <button className="load-subcategories" onClick={() => loadSubcategories(subcat)}>
              {expandedCategories[strippedSubcat] ? '-' : '+'}
            </button>
          </div>
          {expandedCategories[strippedSubcat] && <div className="subcategory-list">{renderSubcategories(expandedCategories[strippedSubcat], level + 1)}</div>}
        </div>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <h2>Choose Categories</h2>
        <div id="categoryList">
          {Object.entries(categoryGroups).map(([group, categories]) => (
            <div key={group} className="category-section">
              <h3>{group} <span className="select-all" onClick={() => toggleAllInGroup(group)}>Select all</span></h3>
              <div className="category-buttons">
                {categories.map(category => {
                  const strippedCategory = stripCategoryPrefix(wikipediaCategories[category]);
                  const underscoredCategory = toUnderscore(strippedCategory);
                  return (
                    <div key={underscoredCategory} style={{ display: 'inline-block', marginRight: '10px' }}>
                      <button 
                        className={`category-button ${selectedCategories.includes(underscoredCategory) ? 'selected' : ''}`}
                        onClick={() => toggleCategory(category)}
                      >
                        <span>{toSpaces(strippedCategory)}</span>
                        <button className="load-subcategories" onClick={(e) => {
                          e.stopPropagation();
                          loadSubcategories(category);
                        }}>
                          {expandedCategories[strippedCategory] ? '-' : '+'}
                        </button>
                      </button>
                      {expandedCategories[strippedCategory] && (
                        <div className="subcategory-list">
                          {renderSubcategories(expandedCategories[strippedCategory])}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <button id="applyCategories" onClick={onClose}>Apply</button>
      </div>
    </div>
  );
};
