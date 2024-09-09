import React, { useState } from 'react';
import { Button, Form, FormControl, InputGroup } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './categorysearch.css'; // Custom CSS file
import ShowSelectedCategories from './ShowSelectedCategories'; 

export const CategorySearch = ({ selectedCategories, onSearch, onOpenModal, setSelectedCategories, onOpenSearchOptions, handleSuggestCategories, onRemoveCategory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const fetchCategorySuggestions = async (query) => {
    const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=allcategories&acprefix=${query}&format=json&origin=*`);
    const data = await response.json();
    setSuggestions(data.query.allcategories.map(cat => cat['*']));
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value) {
      fetchCategorySuggestions(value);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const newCategory = suggestion.replace(/\s+/g, '_');
    if (!selectedCategories.includes(newCategory)) {
      const newSelectedCategories = [...selectedCategories, newCategory];
      setSelectedCategories(newSelectedCategories);
    }
    setSearchTerm('');
    setSuggestions([]);
  };

  return (
    
    <div className="category-search">
              <div className="button-group">
          <Button variant="primary" id="openCategoryDialogBtn" onClick={onOpenModal}>
            Choose Categories
          </Button>
          <Button variant="secondary" onClick={onOpenSearchOptions}>
            Search Options
          </Button>
          <Button variant="info" id="suggestCategoriesButton" onClick={handleSuggestCategories}>
            Suggest Me Categories
          </Button>
        </div>
      <div id="suggestions" className="list-group">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className="list-group-item list-group-item-action"
            onClick={() => handleSuggestionClick(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
      <ShowSelectedCategories
          selectedCategories={selectedCategories}
          onRemoveCategory={onRemoveCategory}
        /> 
      <Form id="searchForm" className="form-inline mt-3" onSubmit={(e) => {
        e.preventDefault();
        onSearch(selectedCategories);
      }}>
        <InputGroup className="mb-0">
          <FormControl
            type="text"
            id="categoryInput"
            name="category"
            placeholder="Enter a category name..."
            value={searchTerm}
            onChange={handleInputChange}
          />
        </InputGroup>


        <div className="search-button-wrapper">
          <Button type="submit" variant="success" id="searchButton">Search</Button>
        </div>
      </Form>
    </div>
  );
};
