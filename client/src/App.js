import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './Firebase'; 
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
import useFetchWatchlist from './utils/useFetchWatchlist';
import Header from './Header';
import { AlertProvider } from './AlertProvider';
import Joyride from 'react-joyride';
import { tourSteps, tourStyles, tourLocale, tourConfig, tourCallbacks } from './config/tourConfig';


import './styles.css';
import axios from 'axios';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
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
  const [isSuggestedCategoriesModalOpen, setIsSuggestedCategoriesModalOpen] = useState(false); 
  const [isSearchOptionsModalOpen, setIsSearchOptionsModalOpen] = useState(false);
  const [wikipediaUsername, setWikipediaUsername] = useState('');
  const [taskSelection, setTaskSelection] = useState('expand');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [expandLanguage, setExpandLanguage] = useState('en');
  const [errorMessage, setErrorMessage] = useState('');
  const [runTour, setRunTour] = useState(false);


  useEffect(() => {
    // Function to check if the Wikipedia user is logged in by extracting the username from URL parameters
    const fetchUserData = async () => {
      try {
        console.log('Fetching user data...');
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/get-user-data`, { credentials: 'include' });
        const data = await response.json();
        if (data.username) {
          setWikipediaUsername(data.username);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
  
    fetchUserData();
  
  
    return;
  }, []);
  
  useEffect(() => {
    // Runs whenever wikipediaUsername or currentUser changes
    if (wikipediaUsername) {
      console.log("fetching wikipedia watchlist");
      //fetchUserWatchlist(); // Fetch the watchlist after user is authenticated
    }
  }, [wikipediaUsername]); // Dependency array to re-run effect when these states change

  const { userInventory, fetchUserWatchlist } = useFetchWatchlist(wikipediaUsername);

  const handleSearch = async () => {
    setIsLoading(true);
    setProgress(0);
    setDebugLog('');
    setSearchResults([]);
    setErrorMessage(''); 
  
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/search_categories?categories=${selectedCategories.join(',')}&task=${taskSelection}&target_language=${targetLanguage}&expandLanguage=${expandLanguage}`,
      );
  
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
  
      const data = await response.json();
      setSearchResults(data.articles);
      setShowDashboard(true);
      setDistinctPagesCount(data.distinct_pages_count);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setErrorMessage('The server is currently unavailable. Please try again later or contact the developer: eladd.wikimedia@gmail.com');
    } finally {
      setIsLoading(false);
    }
  };
  
  const removeFromInventory = async (article) => {
    try {
      console.log('Removing item from inventory:', article.source_title);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/remove_from_watchlist`, 
        { title: { source_title: article.source_title } }, // Send nested source_title in request body
        { withCredentials: true }
      );
      if (response.data.success) {
        console.log('Managed to remove item from watchlist');
        fetchUserWatchlist();
      } else {
        console.error('Failed to remove item from watchlist');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/logout`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Successfully logged out:', data.message);
            setWikipediaUsername(null);
            //  redirect to home page or login page
            window.location.href = '/';
        } else {
            console.error('Logout failed');
            alert('Logout failed. Please try again.');
        }
    } catch (error) {
        console.error('Error during logout:', error);
        alert('An error occurred during logout. Please try again.');
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

  const handleWikipediaSignIn = async () => {
    try {
      console.log('Starting Wikipedia OAuth login at...');
      console.log(`${process.env.REACT_APP_API_URL}/start_wiki_oauth`);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/start_wiki_oauth`);
      const data = await response.json();
      console.log('Wikipedia OAuth data:', data);
      window.location.href = data.authorization_url;
    } catch (error) {
      console.error('Wikipedia Sign-In error:', error);
      alert(`Wikipedia Sign-In error: ${error.message}`);
    }
  };
  return (
    <AlertProvider>
<div id="container">
<Joyride
  steps={tourSteps}
  run={runTour}
  {...tourConfig}
  styles={tourStyles}
  locale={tourLocale}
  callback={(data) => tourCallbacks.handleJoyrideCallback(data, setRunTour)}
/>
<Header 
  wikipediaUsername={wikipediaUsername}
  setWikipediaUsername={setWikipediaUsername}
  handleLogout={handleLogout}
  handleEditProfile={handleEditProfile}
  handleWikipediaSignIn={handleWikipediaSignIn}
  LoginForm={LoginForm}
  userInventory={userInventory}
  removeFromInventory={removeFromInventory}
/>

  {showInventory && (
    <Inventory inventory={userInventory} onRemoveFromInventory={removeFromInventory} />
  )}
  <HowItWorks startTour={() => tourCallbacks.startTour(setRunTour)} isLoggedIn={Boolean(wikipediaUsername)} />
  {errorMessage && (
  <div className="error-banner">
    <span>{errorMessage}</span>
    <button className="close-button" onClick={() => setErrorMessage('')}>×</button>
  </div>
)}
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
        <>
          <Dashboard
            categories={selectedCategories}
            articles={searchResults}
            currentUser={currentUser}
            userInventory={userInventory}
            distinctPagesCount={distinctPagesCount}
            removeFromInventory={removeFromInventory}
            fetchUserWatchlist = {fetchUserWatchlist}
          />
        </>
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
        userInventory={userInventory} 
        setSelectedCategories={setSelectedCategories} 
        selectedCategories={selectedCategories}
        wikipediaUsername={wikipediaUsername} 
      />
      <SearchOptionsModal
        isOpen={isSearchOptionsModalOpen}
        onClose={() => setIsSearchOptionsModalOpen(false)}
        taskSelection={taskSelection}
        setTaskSelection={setTaskSelection}
        targetLanguage={targetLanguage}
        setTargetLanguage={setTargetLanguage}
        expandLanguage={expandLanguage}
        setExpandLanguage={setExpandLanguage}
      />
      <Footer />
    </div>
    </AlertProvider>
  );
}