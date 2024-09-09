import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Loading.css'; // Make sure to import the CSS file

export const Loading = () => {
  const [fact, setFact] = useState('');
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const fetchFact = () => {
      axios.get('https://uselessfacts.jsph.pl/random.json?language=en')
        .then(response => {
          setFade(false);
          setTimeout(() => {
            setFact(response.data.text);
            setFade(true);
          }, 500); // Duration of fade-out effect
        })
        .catch(error => {
          console.error('Error fetching the random fact:', error);
          setFact('Unable to load fact');
        });
    };

    fetchFact(); // Fetch initial fact
    const interval = setInterval(fetchFact, 3000); // Fetch a new fact every 5 seconds

    return () => clearInterval(interval); // Cleanup on component unmount
  }, []);

  return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="spinner"></div>
        <p>Loading...</p>
        <p className={`fact ${fade ? 'fade-in' : 'fade-out'}`}>{fact}</p>
      </div>
    </div>
  );
};
