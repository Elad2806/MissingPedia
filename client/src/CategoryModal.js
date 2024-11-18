import React, { useState, useEffect } from 'react';
import { getSubcategories } from './utils';
import { Modal, Button, Checkbox } from 'antd';
import './CategoryModal.css';

export const CategoryModal = ({ isOpen, onClose, selectedCategories, setSelectedCategories, wikipediaCategories, categoryGroups }) => {
  const [expandedCategories, setExpandedCategories] = useState({});
  const [modalWidth, setModalWidth] = useState(600); // Reduced initial width

  useEffect(() => {
    if (isOpen) {
      setExpandedCategories({});
      setModalWidth(600); // Reset width when opening
    }
  }, [isOpen]);

  const stripCategoryPrefix = (category) => category.replace('Category:', '');
  const addCategoryPrefix = (category) => `Category:${category}`;
  const toUnderscore = (category) => category.replace(/\s+/g, '_');
  const toSpaces = (category) => category.replace(/_/g, ' ');

  const toggleCategory = (category) => {
    const strippedCategory = stripCategoryPrefix(wikipediaCategories[category]);
    const underscoredCategory = toUnderscore(strippedCategory);
    setSelectedCategories((prev) =>
      prev.includes(underscoredCategory)
        ? prev.filter((c) => c !== underscoredCategory)
        : [...prev, underscoredCategory]
    );
  };

  const toggleAllInGroup = (group) => {
    const groupCategories = categoryGroups[group].map((cat) =>
      toUnderscore(stripCategoryPrefix(wikipediaCategories[cat]))
    );
    const allSelected = groupCategories.every((cat) => selectedCategories.includes(cat));

    if (allSelected) {
      setSelectedCategories((prev) => prev.filter((c) => !groupCategories.includes(c)));
    } else {
      setSelectedCategories((prev) => {
        return [...new Set([...prev, ...groupCategories])];
      });
    }
  };

  const toggleSubcategory = (subcategory) => {
    const strippedSubcategory = stripCategoryPrefix(subcategory);
    const underscoredSubcategory = toUnderscore(strippedSubcategory);
    setSelectedCategories((prev) =>
      prev.includes(underscoredSubcategory)
        ? prev.filter((c) => c !== underscoredSubcategory)
        : [...prev, underscoredSubcategory]
    );
  };

  const loadSubcategories = async (category) => {
    const categoryName = wikipediaCategories[category] || category;
    const strippedCategoryName = stripCategoryPrefix(categoryName);

    if (expandedCategories[strippedCategoryName]) {
      setExpandedCategories((prev) => ({ ...prev, [strippedCategoryName]: null }));
      setModalWidth((prevWidth) => Math.max(prevWidth - 100, 600)); // Decrease width, min 600
    } else {
      const fullCategoryName = addCategoryPrefix(strippedCategoryName);
      const subcategories = await getSubcategories(fullCategoryName);
      setExpandedCategories((prev) => ({ ...prev, [strippedCategoryName]: subcategories }));
      setModalWidth((prevWidth) => prevWidth + 100); // Increase width
    }
  };

  const renderSubcategories = (subcategories, level = 1) => {
    return subcategories.map((subcat) => {
      const strippedSubcat = stripCategoryPrefix(subcat);
      const underscoredSubcat = toUnderscore(strippedSubcat);
      return (
        <div
          key={underscoredSubcat}
          className="subcategory-item"
          style={{ paddingLeft: `${level * 20}px` }}
        >
          <Checkbox
            checked={selectedCategories.includes(underscoredSubcat)}
            onChange={() => toggleSubcategory(subcat)}
          >
            {toSpaces(strippedSubcat)}
          </Checkbox>
          <Button
            type="link"
            onClick={() => loadSubcategories(subcat)}
            className="expand-button"
          >
            {expandedCategories[strippedSubcat] ? '-' : '+'}
          </Button>
          {expandedCategories[strippedSubcat] && (
            <div className="subcategory-list">
              {renderSubcategories(
                expandedCategories[strippedSubcat],
                level + 1
              )}
            </div>
          )}
        </div>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <Modal
      title="Choose Categories"
      visible={isOpen}
      onCancel={onClose}
      width={modalWidth}
      footer={[
        <Button key="apply" onClick={onClose} type="primary">
          Apply
        </Button>,
      ]}
    >
      <div id="categoryList">
        {Object.entries(categoryGroups).map(([group, categories]) => (
          <div key={group} className="category-section">
            <h3>
              {group}{' '}
              <Button
                type="link"
                onClick={() => toggleAllInGroup(group)}
                className="select-all-button"
              >
                Select all
              </Button>
            </h3>
            <div className="category-buttons">
              {categories.map((category) => {
                const strippedCategory = stripCategoryPrefix(
                  wikipediaCategories[category]
                );
                const underscoredCategory = toUnderscore(strippedCategory);
                const isSelected = selectedCategories.includes(underscoredCategory);
                return (
                  <div
                    key={underscoredCategory}
                    className="category-button-wrapper"
                  >
                    <Button
                      type={isSelected ? 'primary' : 'default'}
                      onClick={() => toggleCategory(category)}
                      className={`category-button ${isSelected ? 'selected' : ''}`}
                    >
                      {toSpaces(strippedCategory)}
                      <Button
                        type="link"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadSubcategories(category);
                        }}
                        className="expand-button"
                      >
                        {expandedCategories[strippedCategory] ? '-' : '+'}
                      </Button>
                    </Button>
                    {expandedCategories[strippedCategory] && (
                      <div className="subcategory-list">
                        {renderSubcategories(
                          expandedCategories[strippedCategory]
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};