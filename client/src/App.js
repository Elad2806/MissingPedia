import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './Firebase'; // Make sure this path is correct
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { LoginForm } from './LoginForm';
import { CategorySearch } from './CategorySearch';
import { ArticleList } from './ArticleList';
import { Inventory } from './Inventory';
import { ProgressBar } from './ProgressBar';
import { DebugLog } from './DebugLog';
import { Loading } from './Loading';
import { CategoryModal } from './CategoryModal';
import { EditProfileModal } from './EditProfileModal';
import { SuggestedCategoriesModal } from './SuggestedCategoriesModal';
import ShowSelectedCategories from './ShowSelectedCategories'; 
import { searchCategories, wikipediaCategories, categoryGroups } from './utils';
import Footer from './Footer'; 
import Dashboard from './Dashboard';
import SearchOptionsModal from './SearchOptionsModal'; 
import HowItWorks from './HowItWorks'; 

import './styles.css';
import axios from 'axios';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userInventory, setUserInventory] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [debugLog, setDebugLog] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [distinctPagesCount, setDistinctPagesCount] = useState(0);
  const [showInventory, setShowInventory] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isSuggestedCategoriesModalOpen, setIsSuggestedCategoriesModalOpen] = useState(false); // State for SuggestedCategoriesModal
  const [isSearchOptionsModalOpen, setIsSearchOptionsModalOpen] = useState(false);
  const [wikipediaUsername, setWikipediaUsername] = useState('');
  const [taskSelection, setTaskSelection] = useState('expand');
  const [targetLanguage, setTargetLanguage] = useState('en');

  useEffect(() => {
    // Function to check if the Wikipedia user is logged in by extracting the username from URL parameters
    const checkWikipediaUser = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const username = urlParams.get('username');
      if (username) {
        setWikipediaUsername(username); // Set Wikipedia username in state
      }
    };
  
    // Call the function to check Wikipedia user status
    checkWikipediaUser();
  
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('User:', user);
  
      if (user) {
        setCurrentUser(user);
        await fetchUserInventory(user.uid);
      } else {
        console.log("No user logged in");
        setCurrentUser(null);
        setUserInventory([]);
      }
    });
  
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    // Runs whenever wikipediaUsername or currentUser changes
    if (wikipediaUsername) {
      console.log("fetching wikipedia watchlist");
      fetchUserWatchlist(); // Fetch the watchlist after user is authenticated
    }
  }, [wikipediaUsername, currentUser]); // Dependency array to re-run effect when these states change




  const fetchUserWatchlist = async () => {
    try {
      const response = await fetch('http://localhost:3000/fetch_watchlist', {
        method: 'GET',
        credentials: 'include',  // Include credentials in the request
      });
      const data = await response.json();
      console.log('Watchlist:', data);
      if (data.watchlist) {
        const watchlistArticles = data.watchlist.map((title) => ( title ));
        setUserInventory(watchlistArticles);
        console.log('Watchlist articles:',  watchlistArticles);

      } else {
        console.error('Failed to fetch watchlist:', data.error);
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    }
  };

  const fetchUserInventory = async (userId) => {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      setUserInventory(userDoc.data().inventory || []);
    }
  };

  const handleSearch = async () => {
    setIsLoading(true);
    setProgress(0);
    setDebugLog('');
    setSearchResults([]);
  
    try {
      console.log(`${process.env.REACT_APP_API_URL}/api/search_categories?categories=${selectedCategories.join(',')}&task=${taskSelection}&target_language=${targetLanguage}`);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/search_categories?categories=${selectedCategories.join(',')}&task=${taskSelection}&target_language=${targetLanguage}`
      );
      console.log('Response:', response);
      const data = await response.json();
      console.log('Data:', data);
      setSearchResults(data.articles);
      setShowDashboard(true);
      setDistinctPagesCount(data.distinct_pages_count);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setIsLoading(false);
    }
  };
  

  const addToInventory = async (article) => {
    if (!currentUser) {
      alert("Please login to add articles to your inventory.");
      return;
    }
    if (!userInventory.some(item => item.title === article.title)) {
      const newInventory = [...userInventory, article];
      setUserInventory(newInventory);
      await setDoc(doc(db, 'users', currentUser.uid), { inventory: newInventory }, { merge: true });
    }
  };

  const removeFromInventory = async (title) => {
    try {
      const response = await axios.post('http://localhost:3000/remove_from_watchlist', 
        { title }, 
        { withCredentials: true }
      );
      if (response.data.success) {
        setUserInventory(prevWatchlist => prevWatchlist.filter(item => item !== title));
      } else {
        console.error('Failed to remove item from watchlist');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setShowDashboard(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleEditProfile = () => {
    setIsEditProfileModalOpen(true);
  };

  const handleUpdateProfile = async (username) => {
    if (currentUser) {
      await setDoc(doc(db, 'users', currentUser.uid), { wikipediaUsername: username }, { merge: true });
      setIsEditProfileModalOpen(false);
    }
  };

  const handleSuggestCategories = () => {
    setIsSuggestedCategoriesModalOpen(true);
  };

  const handleRemoveCategory = (categoryToRemove) => {
    setSelectedCategories(selectedCategories.filter(category => category !== categoryToRemove));
  };

  return (
<div id="container">
  <h1>MissingPedia</h1>
  {!currentUser ? (
    <LoginForm
      wikipediaUsername={wikipediaUsername} 
      setWikipediaUsername={setWikipediaUsername}
    />
  ) : (
    <div id="logoutSection">
      <p>
        Welcome, {currentUser.displayName || currentUser.email}!
        {wikipediaUsername && (
          <>
            {' '}
            <a id="editProfileLink" href="#" onClick={handleEditProfile}>
              (Edit Profile)
            </a>
          </>
        )}
      </p>
      {wikipediaUsername && <p>Wikipedia Username: {wikipediaUsername}</p>}
      <button id="logoutButton" onClick={handleLogout}>Logout</button>
    </div>
  )}
  {wikipediaUsername && <button onClick={() => setShowInventory(!showInventory)}>
    {showInventory ? 'Hide' : 'Open'} Article Inventory
  </button>}
  {showInventory && (
    <Inventory inventory={userInventory} onRemoveFromInventory={removeFromInventory} />
  )}
  <HowItWorks />
      <CategorySearch
        selectedCategories={selectedCategories}
        onSearch={handleSearch}
        onOpenModal={() => setIsModalOpen(true)}
        setSelectedCategories={setSelectedCategories}
        onOpenSearchOptions={() => setIsSearchOptionsModalOpen(true)}
        handleSuggestCategories={handleSuggestCategories}

        onRemoveCategory={handleRemoveCategory}
      />
      {!showDashboard ? (
        <>
          <ProgressBar progress={progress} />
        </>
      ) : (
        <Dashboard
          categories={selectedCategories}
          articles={searchResults}
          currentUser={currentUser}
          userInventory={userInventory}
          setUserInventory={setUserInventory}
          distinctPagesCount={distinctPagesCount}
        />
      )}

      <DebugLog log={debugLog} />
      {isLoading && <Loading />}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        wikipediaCategories={wikipediaCategories}
        categoryGroups={categoryGroups}
      />
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        onUpdateProfile={handleUpdateProfile}
      />
      <SuggestedCategoriesModal
        isOpen={isSuggestedCategoriesModalOpen}
        onClose={() => setIsSuggestedCategoriesModalOpen(false)}
        userInventory={userInventory} // Pass the user inventory to the modal
        setSelectedCategories={setSelectedCategories} // Pass the setSelectedCategories function to the modal
        selectedCategories={selectedCategories} // Pass the selected categories to the modal
      />
      <SearchOptionsModal
        isOpen={isSearchOptionsModalOpen}
        onClose={() => setIsSearchOptionsModalOpen(false)}
        taskSelection={taskSelection}
        setTaskSelection={setTaskSelection}
        targetLanguage={targetLanguage}
        setTargetLanguage={setTargetLanguage}
      />
      <Footer />
    </div>
  );
}