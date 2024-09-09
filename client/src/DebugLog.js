import React from 'react';

export const DebugLog = ({ log }) => {
  if (!log) return null;

  return (
    <div id="debugLog">
      <h3>Debug Log</h3>
      <pre>{log}</pre>
    </div>
  );
};