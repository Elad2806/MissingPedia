import React from 'react';
import './inventory.css';

export const Inventory = ({ inventory, onRemoveFromInventory }) => {
  if (inventory.length === 0) return <p>Your inventory is empty.</p>;

  return (
    <div id="inventory">
      <h2>Your Inventory</h2>
      <ul>
        {inventory.map(article => (
          <li key={article}>
            <span>{article}</span>
            <button onClick={() => onRemoveFromInventory(article)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
