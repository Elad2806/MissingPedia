import React from 'react';

export const ProgressBar = ({ progress }) => {
  return (
    <div className="progress-bar">
      <div 
        className="progress"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};