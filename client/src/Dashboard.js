import React, { useEffect, useState } from 'react';
import { createPlaceholderImage } from './utils';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './Firebase';
import { 
  Card, CardContent, CardMedia, Typography, Button, 
  Grid, List, ListItem, ListItemText, Chip, Link,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { styled } from '@mui/system';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';
import useFetchWatchlist from './utils/useFetchWatchlist';
import { useAlert } from './AlertProvider'; 
import LanguagesDropdown from './LanguagesDropdown';

const StyledCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  marginBottom: theme.spacing(3),
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
  border: '1px solid #e0e0e0',
  padding: theme.spacing(2),
  height: 200, // Fix height
  width: '100%', // Ensure the card fills its parent width
  maxWidth: 800, // Set a consistent max width
  alignItems: 'center',
  justifyContent: 'space-between', // Ensure content is evenly spaced
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    height: 'auto',
  },
}));

const StyledCardMedia = styled(CardMedia)(({ theme }) => ({
  width: 150,
  height: 150,
  objectFit: 'cover',
  borderRadius: '8px',
  border: '1px solid #ccc',
  flexShrink: 0, // Prevent image from resizing
}));

const ContentWrapper = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  flex: 1,
  paddingLeft: theme.spacing(2),
}));

const LeftContent = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
}));

const RightContent = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  minWidth: 100, // Prevent button section from shrinking
}));

const StyledButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(1),
  width: 'max-content', // Ensure button doesn't stretch
}));


const StyledAccordion = styled(Accordion)(({ theme }) => ({
  marginTop: 0, // Adjust margin to align with the content
  backgroundColor: '#fafafa', // Accordion background color
  border: '1px solid #ddd', // Border around accordion
}));

const Dashboard = ({ categories, articles, currentUser, userInventory, distinctPagesCount, removeFromInventory, fetchUserWatchlist }) => {
  const [articleImages, setArticleImages] = useState({});
  const showAlert = useAlert();
  useEffect(() => {
    const fetchImages = async () => {
      const images = {};
      for (const article of articles) {
        try {
          const response = await fetch(
            `https://en.wikipedia.org/w/api.php?action=query&titles=${article.source_title}&prop=pageimages&piprop=thumbnail&pithumbsize=500&format=json&origin=*`
          );
          const data = await response.json();
          console.log("")
          const page = Object.values(data.query.pages)[0];
          images[article.source_title] = page.thumbnail ? page.thumbnail.source : createPlaceholderImage();
        } catch (error) {
          images[article.source_title] = createPlaceholderImage();
        }
      }
      setArticleImages(images);
    };

    if (articles.length) {
      fetchImages();
    }
  }, [articles]);

  const categoriesList = categories.join(', ');

  // const addToInventory = async (article) => {
  //   if (!currentUser) {
  //     alert("Please login to add articles to your inventory.");
  //     return;
  //   }
  //   if (!userInventory.some(item => item.id === article.source_id)) {
  //     const newInventory = [...userInventory, { id: article.source_id, title: article.source_title }];
  //     useFetchWatchlist(currentUser);
  //     await setDoc(doc(db, 'users', currentUser.uid), { inventory: newInventory }, { merge: true });
  //   }
  // };

  const addToWatchlist = async (title) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/add_to_watchlist`, 
        { title }, 
        { withCredentials: true }
      );
      if (response.data.success) {
        fetchUserWatchlist();
        showAlert(`Article "${title.source_title}" added to watchlist`);
      } else {
        showAlert('Failed to add item to watchlist', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('An error occurred while adding to watchlist', 'error');
    }
  };

  // const removeFromInventory = async (article) => {
  //   const newInventory = userInventory.filter(item => item.id !== article.source_id);
  //   setUserInventory(newInventory);
  //   await setDoc(doc(db, 'users', currentUser.uid), { inventory: newInventory }, { merge: true });
  // };

  return (
    <List>
      {articles.map((article) => (
        <ListItem key={article.source_id} disablePadding>
          <StyledCard>
            <StyledCardMedia
              component="img"
              image={articleImages[article.source_title] || createPlaceholderImage()}
              alt={article.source_title}
            />
            <ContentWrapper>
              <LeftContent>
                <Typography variant="h6">
                  <Link
                    href={`https://${article.source_language}.wikipedia.org/wiki/${article.source_title.replace(/ /g, '_')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="inherit"
                  >
                    {article.source_title.replace(/_/g, ' ')}
                  </Link>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Length: {article.source_length || 0} characters
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Views (last 30 days): {article.source_views || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Views/Content Ratio: {(article.len_views_ratio || 0).toFixed(4)}
                </Typography>
                
                {article.other_languages.length > 0 && (
  <LanguagesDropdown languages={article.other_languages} />
)}

                
              </LeftContent>
              <RightContent>

                {userInventory.some(item => item === article.source_title) ? (
                  <StyledButton 
                    variant="contained" 
                    color="secondary" 
                    onClick={() => removeFromInventory(article)}
                  >
                    Remove from Inventory
                  </StyledButton>
                ) : (
                  <StyledButton 
                    variant="contained" 
                    onClick={() => addToWatchlist(article)}
                  >
                    Add to Inventory
                  </StyledButton>
                )}
              </RightContent>
            </ContentWrapper>
          </StyledCard>
        </ListItem>
      ))}
    </List>
  );
  
};

export default Dashboard;
