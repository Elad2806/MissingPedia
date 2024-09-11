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

const StyledCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  marginBottom: theme.spacing(3),
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
  border: '1px solid #e0e0e0',
  padding: theme.spacing(1),
  height: 'auto', // Auto height to ensure flexibility with content
  alignItems: 'flex-start', // Ensure everything aligns to the top
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
  },
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
  },
}));

const ContentWrapper = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  justifyContent: 'flex-start',
  paddingLeft: theme.spacing(1),
  paddingTop: 0, // Ensure no top padding
  marginTop: -10, // Remove any margin for proper alignment
}));

const StyledCardMedia = styled(CardMedia)(({ theme }) => ({
  width: 150,
  height: 150,
  objectFit: 'cover',
  borderRadius: '8px',
  border: '1px solid #ccc',
  marginTop: theme.spacing(5),
  marginLeft: theme.spacing(1),
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    height: 180,
  },
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  marginTop: 0, // Ensure there's no top margin
  paddingTop: 0, // Remove any padding for proper alignment
}));

const StyledButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  backgroundColor: '#2196f3', // Primary color for button
  '&:hover': {
    backgroundColor: '#1976d2', // Darker shade on hover
  },
}));

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  marginTop: 0, // Adjust margin to align with the content
  backgroundColor: '#fafafa', // Accordion background color
  border: '1px solid #ddd', // Border around accordion
}));

const Dashboard = ({ categories, articles, currentUser, userInventory, setUserInventory, distinctPagesCount }) => {
  const [articleImages, setArticleImages] = useState({});

  useEffect(() => {
    const fetchImages = async () => {
      const images = {};
      for (const article of articles) {
        try {
          const response = await fetch(
            `https://en.wikipedia.org/w/api.php?action=query&titles=${article.source_title}&prop=pageimages&piprop=thumbnail&pithumbsize=500&format=json&origin=*`
          );
          const data = await response.json();
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

  const addToInventory = async (article) => {
    if (!currentUser) {
      alert("Please login to add articles to your inventory.");
      return;
    }
    if (!userInventory.some(item => item.id === article.source_id)) {
      const newInventory = [...userInventory, { id: article.source_id, title: article.source_title }];
      setUserInventory(newInventory);
      await setDoc(doc(db, 'users', currentUser.uid), { inventory: newInventory }, { merge: true });
    }
  };

  const removeFromInventory = async (article) => {
    const newInventory = userInventory.filter(item => item.id !== article.source_id);
    setUserInventory(newInventory);
    await setDoc(doc(db, 'users', currentUser.uid), { inventory: newInventory }, { merge: true });
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Top Articles in: {Array.isArray(categoriesList)
          ? categoriesList.join(', ').replace(/_/g, ' ')
          : categoriesList.replace(/_/g, ' ')}
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Number of scanned pages: {distinctPagesCount}
      </Typography>
      <List>
        {articles.map((article) => (
          <ListItem key={article.source_id} disablePadding>
            <StyledCard>
              <StyledCardMedia
                component="img"
                image={articleImages[article.source_title] || createPlaceholderImage()}
                alt={article.source_title}
              />
              <CardContent>
                <ContentWrapper>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <StyledTypography  variant="h6" component="div">
                        <Link
                          href={`https://${article.source_language}.wikipedia.org/wiki/${article.source_title.replace(/ /g, '_')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          color="inherit"
                        >
                          {article.source_title.replace(/_/g, ' ')}
                        </Link>
                      </StyledTypography>
                      <Typography variant="body2" color="text.secondary">
                         Length: {article.source_length || 0} characters
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Views (last 30 days): {article.source_views || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Views/Content Ratio: {(article.len_views_ratio || 0).toFixed(4)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Available in {article.other_languages.length + 1} languages
                      </Typography>
                      <Chip 
                        label={article.source_language} 
                        color="primary" 
                        size="small" 
                        style={{ marginTop: 8, marginRight: 4 }}
                      />
                      {article.other_languages.slice(0, 3).map((lang, index) => (
                        <Chip 
                          key={index} 
                          label={lang.language} 
                          size="small" 
                          style={{ marginTop: 8, marginRight: 4 }}
                        />
                      ))}
                      {article.other_languages.length > 3 && (
                        <Chip 
                          label={`+${article.other_languages.length - 3} more`} 
                          size="small" 
                          style={{ marginTop: 8 }}
                        />
                      )}
                      {userInventory.some(item => item.id === article.source_id) ? (
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
                          onClick={() => addToInventory(article)}
                        >
                          Add to Inventory
                        </StyledButton>
                      )}
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <StyledAccordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography>Other Languages</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List dense>
                            {article.other_languages.map((lang, index) => (
                              <ListItem key={index} disablePadding>
                                <ListItemText
                                  primary={
                                    <Link
                                      href={`https://${lang.language}.wikipedia.org/wiki/${lang.title.replace(/ /g, '_')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      color="inherit"
                                    >
                                      {lang.language}: {lang.title}
                                    </Link>
                                  }
                                  secondary={`Length: ${lang.length}, Views: ${lang.views}`}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </AccordionDetails>
                      </StyledAccordion>
                    </Grid>
                  </Grid>
                </ContentWrapper>
              </CardContent>
            </StyledCard>
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default Dashboard;
