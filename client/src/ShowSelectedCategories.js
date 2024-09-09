import React from 'react';
import { X } from 'lucide-react';
import './showselectedcategories.css'; // Custom CSS file

const ShowSelectedCategories = ({ selectedCategories, onRemoveCategory }) => {
  return (
    <div className="selected-categories-container">
      {selectedCategories.map((category, index) => (
        <div key={index} className="selected-category-box">
          {/* Replace underscores with spaces */}
          <span>{category.replace(/_/g, ' ')}</span>
          <button
            className="remove-category-button"
            onClick={() => onRemoveCategory(category)}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ShowSelectedCategories;
