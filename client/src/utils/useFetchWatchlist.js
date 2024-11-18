import { useEffect, useState, useCallback } from 'react';

const useFetchWatchlist = (wikipediaUsername) => {
  const [userInventory, setUserInventory] = useState([]);

  // Using useCallback to prevent unnecessary re-creations of the function
  const fetchUserWatchlist = useCallback(async () => {
    if (wikipediaUsername) {
      console.log("fetching wikipedia watchlist");
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/fetch_watchlist`, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        if (data.watchlist) {
          const watchlistArticles = data.watchlist.map((title) => title);
          setUserInventory(watchlistArticles);
          console.log('Watchlist articles:', watchlistArticles);
        } else {
          console.error('Failed to fetch watchlist:', data.error);
        }
      } catch (error) {
        console.error('Error fetching watchlist:', error);
      }
    }
  }, [wikipediaUsername]);

  useEffect(() => {
    fetchUserWatchlist();
  }, [fetchUserWatchlist]);

  return { userInventory, fetchUserWatchlist };
};

export default useFetchWatchlist;