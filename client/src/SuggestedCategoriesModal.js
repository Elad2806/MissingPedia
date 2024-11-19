import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Box, 
  Typography, 
  Button, 
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  FormControl, 
  FormLabel,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  CircularProgress,
  Paper,
  Chip
} from '@mui/material';
import CategoryIcon from '@mui/icons-material/CategoryOutlined';
import SelectAllIcon from '@mui/icons-material/SelectAll';

const formatCategory = (category) => {
  return category
    .replace('Category:', '')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const SuggestedCategoriesModal = ({ 
  isOpen, 
  onClose, 
  userInventory, 
  setSelectedCategories, 
  selectedCategories,
  wikipediaUsername 
}) => {
  const [suggestedCategories, setSuggestedCategories] = useState([]);
  const [recommendationType, setRecommendationType] = useState('inventory');
  const [isLoading, setIsLoading] = useState(false);
  
  // Temporary state for categories selected in this modal
  const [tempSelectedCategories, setTempSelectedCategories] = useState([]);

  const fetchSuggestedCategories = async () => {
    setIsLoading(true);
    try {
      let payload;
      if (recommendationType === 'inventory') {
        payload = { articles: userInventory, recommendationType };
      } else {
        payload = { wikipediaUsername, recommendationType };
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/suggest_categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      const formattedCategories = data.categories.map(formatCategory);
      setSuggestedCategories(formattedCategories);
    } catch (error) {
      console.error('Error fetching suggested categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset temporary selected categories when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSuggestedCategories();
      // Initialize temp selected with current selected categories
      setTempSelectedCategories([...selectedCategories]);
    }
  }, [isOpen, recommendationType]);

  const handleCategorySelect = (category) => {
    if (!tempSelectedCategories.includes(category)) {
      setTempSelectedCategories([...tempSelectedCategories, category]);
    } else {
      setTempSelectedCategories(tempSelectedCategories.filter((c) => c !== category));
    }
  };

  const handleSelectAll = () => {
    if (tempSelectedCategories.length === suggestedCategories.length) {
      // If all are already selected, deselect all
      setTempSelectedCategories([]);
    } else {
      // Select all suggested categories
      setTempSelectedCategories([...suggestedCategories]);
    }
  };

  const handleConfirm = () => {
    // Only update the actual selected categories when confirmed
    setSelectedCategories(tempSelectedCategories);
    onClose();
  };

  const handleCancel = () => {
    // Reset temp selected categories to original selected categories
    setTempSelectedCategories([...selectedCategories]);
    onClose();
  };

  return (
    <Modal 
      open={isOpen} 
      onClose={handleCancel}
      aria-labelledby="suggested-categories-modal-title"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 500,
        maxWidth: '95vw',
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 3,
        borderRadius: 3,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CategoryIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography 
            id="suggested-categories-modal-title" 
            variant="h5" 
            component="h2" 
            sx={{ flexGrow: 1, fontWeight: 600 }}
          >
            Category Suggestions
          </Typography>
          {suggestedCategories.length > 0 && (
            <Chip 
              label={`${tempSelectedCategories.length} Selected`} 
              color="primary" 
              size="small" 
              sx={{ mr: 1 }}
            />
          )}
        </Box>

        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend">Recommendation Source</FormLabel>
          <RadioGroup 
            row 
            value={recommendationType} 
            onChange={(e) => setRecommendationType(e.target.value)}
          >
            <FormControlLabel 
              value="inventory" 
              control={<Radio />} 
              label="Your Inventory" 
            />
            <FormControlLabel 
              value="editHistory" 
              control={<Radio />} 
              label="Wikipedia Edits" 
            />
          </RadioGroup>
        </FormControl>

        <Button 
          variant="outlined" 
          color="primary"
          onClick={fetchSuggestedCategories} 
          disabled={isLoading}
          sx={{ mb: 2 }}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Refresh Suggestions'}
        </Button>

        {suggestedCategories.length > 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Button 
              variant="text" 
              startIcon={<SelectAllIcon />}
              onClick={handleSelectAll}
              sx={{ ml: 1 }}
            >
              {tempSelectedCategories.length === suggestedCategories.length 
                ? 'Deselect All' 
                : 'Select All'}
            </Button>
          </Box>
        ) : null}

        {suggestedCategories.length > 0 ? (
          <Paper 
            elevation={0} 
            sx={{ 
              maxHeight: 300, 
              overflow: 'auto',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2
            }}
          >
            <List dense>
              {suggestedCategories.map((category, index) => (
                <ListItem 
                  key={index} 
                  disableGutters
                  sx={{ 
                    pl: 2,
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <Checkbox
                    edge="start"
                    checked={tempSelectedCategories.includes(category)}
                    onChange={() => handleCategorySelect(category)}
                    sx={{ mr: 2 }}
                  />
                  <ListItemText 
                    primary={
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: tempSelectedCategories.includes(category) ? 600 : 400,
                          color: tempSelectedCategories.includes(category) ? 'primary.main' : 'inherit'
                        }}
                      >
                        {category}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            py: 3,
            textAlign: 'center'
          }}>
            <Typography variant="body1" color="textSecondary">
              {isLoading 
                ? "Fetching category suggestions..." 
                : "No suggestions available. Try changing the recommendation source."}
            </Typography>
          </Box>
        )}

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          mt: 2 
        }}>
          <Button 
            onClick={handleCancel} 
            variant="text" 
            color="secondary"
            sx={{ mr: 1 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            variant="contained" 
            color="primary"
            disabled={tempSelectedCategories.length === 0}
          >
            Confirm Selection
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};